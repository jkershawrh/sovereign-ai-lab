# kata-cc TDX Confidential Guest — Blocker Analysis

**Date:** 2026-07-23
**Cluster:** Oberon (Intel Xeon 6767P, single-node OpenShift 4.20)
**Status:** Blocked — TDX VM boots but kata agent never connects via vsock

---

## What works

| Component | Status | Detail |
|---|---|---|
| TDX hardware | Ready | `kvm_intel.tdx=Y`, CPU flag `tdx_host_platform`, TDX module 2.0.04.08 |
| TDX keys | Available | 31 `tdx.intel.com/keys` allocatable |
| OVMF firmware | Installed | `/usr/share/edk2/ovmf/OVMF.inteltdx.fd` (4MB) |
| kata-cc kernel | Installed | `6.12.0-124.21.1.el10_1.x86_64/vmlinuz` + `kata-cc.initrd` |
| QEMU binary | TDX-capable | `tdx-guest` object compiled in (`strings qemu-kvm \| grep tdx-guest`) |
| Sandboxed Containers operator | v1.13.0 | KataConfig completed, `kata-cc` RuntimeClass created |
| Intel TDX DCAP operator | v0.1.0 | TdxQuoteGenerationService `intel-tdx-dcap` Ready |
| CRI-O handler | Configured | `50-kata-tdx` → `/etc/kata-containers/kata-tdx/configuration.toml` |
| Regular `kata` runtime | Working | 4+ VMs running for 21 days (triforce demo) |
| SGX devices | Present | `/dev/sgx_enclave`, `/dev/sgx_provision`, `/dev/sgx_vepc` |
| TPM | Present | `/dev/tpm0`, `/dev/tpmrm0`, PCR values readable |

## What fails

**Symptom:** Pod with `runtimeClassName: kata-cc` stays in `ContainerCreating` indefinitely.

**Error chain (from CRI-O journal):**

```
level=warning msg="Nvdimm is not supported with confidential guest, disabling it."
level=warning msg="qemu-kvm: host doesn't support requested feature: CPUID.kvm-asyncpf-int"
level=error  msg="Cannot start VM" error="Failed to Check if grpc server is working:
  rpc error: code = DeadlineExceeded desc = timed out connecting to vsock <CID>:1024"
level=error  msg="Failed to connect to QEMU instance" error="dial unix
  /run/vc/vm/<sandbox>/qmp.sock: connect: connection refused"
```

**Translation:** QEMU starts the TDX VM but the guest kernel/agent never becomes reachable. The kata shim tries to connect to the kata agent via vsock port 1024 inside the VM and times out after ~10 seconds.

## Root cause hypotheses

### 1. Kernel/QEMU version mismatch (most likely)

The kata-cc kernel is RHEL 10 (`6.12.0-124.21.1.el10_1.x86_64`) but QEMU is RHEL 9 (`10.1.0-17.el9_8`). TDX guest launch requires tight coordination between the guest kernel, TDVF firmware, and QEMU's TDX implementation. A cross-RHEL-version mismatch could cause the guest to hang during boot.

**Verify:** Run QEMU manually with the TDX configuration and monitor the guest console:

```bash
/usr/libexec/qemu-kvm \
  -machine q35,accel=kvm,confidential-guest-support=tdx0 \
  -object tdx-guest,id=tdx0 \
  -cpu host,pmu=off \
  -m 2048 \
  -kernel /usr/share/kata-containers/osbuilder-images/kata-cc.kernel \
  -initrd /usr/share/kata-containers/osbuilder-images/kata-cc.initrd \
  -bios /usr/share/edk2/ovmf/OVMF.inteltdx.fd \
  -nographic \
  -append "console=hvc0 debug" \
  -no-reboot
```

If the VM hangs before printing any kernel output, the firmware/kernel combination is incompatible.

### 2. vsock timeout too short

The kata configuration has a default sandbox creation timeout. TDX VMs take longer to boot (TDVF firmware initialization, SEPT page acceptance, memory encryption setup). The default timeout may be too short.

**Fix:** Add to `/etc/kata-containers/kata-tdx/config.d/99-timeout.toml`:

```toml
[hypervisor.qemu]
# TDX VM boot is slower due to memory encryption setup
boot_timeout = 60
```

### 3. NVDIMM disabled but virtiofs not configured

The config has `shared_fs = "none"` and the warning says NVDIMM is disabled for confidential guests. Without either shared filesystem mechanism, the container image must be pulled inside the VM via network. If the VM's network interface isn't up before the vsock timeout, the agent can't start.

**Verify:** Check if the kata agent is configured for image pulling and whether it has the correct registry credentials inside the VM.

### 4. SELinux or seccomp blocking TDX VM launch

The QEMU process may be blocked from making TDX-specific KVM ioctls (KVM_TDX_INIT_VM, KVM_TDX_INIT_VCPU) by SELinux policy.

**Verify:**

```bash
ausearch -m avc -ts recent | grep -i qemu
```

## What to try (in order)

### Quick fix: Increase boot timeout

```bash
mkdir -p /etc/kata-containers/kata-tdx/config.d/
cat > /etc/kata-containers/kata-tdx/config.d/99-tdx-timeout.toml << 'EOF'
[hypervisor.qemu]
boot_timeout = 120
EOF
systemctl restart crio
```

Then test:

```bash
oc run kata-cc-test --image=registry.access.redhat.com/ubi9-micro:latest \
  --restart=Never --overrides='{"spec":{"runtimeClassName":"kata-cc"}}' \
  --command -- sleep 30 -n sovereign-ai-lab
```

### Manual QEMU test (definitive diagnosis)

SSH to the Oberon node and run QEMU manually with the kata-cc config. Watch the console output to see where boot stops:

```bash
/usr/libexec/qemu-kvm \
  -machine q35,accel=kvm,confidential-guest-support=tdx0,kernel-irqchip=split \
  -object tdx-guest,id=tdx0 \
  -cpu host,pmu=off \
  -m 2048 \
  -kernel /usr/share/kata-containers/osbuilder-images/kata-cc.kernel \
  -initrd /usr/share/kata-containers/osbuilder-images/kata-cc.initrd \
  -bios /usr/share/edk2/ovmf/OVMF.inteltdx.fd \
  -device vhost-vsock-pci,guest-cid=42 \
  -nographic \
  -append "console=hvc0 debug panic=1 nr_cpus=1 agent.log=debug" \
  -no-reboot
```

Expected outcomes:
- **No output at all:** TDVF firmware incompatible with QEMU/TDX module version
- **TDVF output but no kernel boot:** Kernel image not compatible with TDVF launch
- **Kernel boots but agent doesn't start:** vsock or agent configuration issue
- **Everything works:** The issue is in kata's sandbox orchestration, not QEMU

### Upgrade path

If the kernel/QEMU mismatch is confirmed, the options are:

1. **Match the kernel to QEMU:** Use the RHEL 9 kata kernel instead of the RHEL 10 one. Check if `kata-containers` provides a RHEL 9 kernel variant.

2. **Match QEMU to the kernel:** Layer a newer QEMU via `rpm-ostree override` from a TDX-specific repo.

3. **Use peer pods instead of local VM:** Set `enablePeerPods: true` in KataConfig. This launches confidential VMs via a cloud API adapter instead of local QEMU. Requires additional configuration but avoids the local QEMU compatibility issue.

## Current mitigation

The sovereign AI lab runs without `runtimeClassName: kata-cc`. The attestation script (`infra/tdx/attest.sh`) detects the TDX hardware at the host level and reports `attestation_level: tdx-host-confirmed` with the CPU model, TDX module version, and TPM PCR values. When kata-cc becomes operational, the same script will automatically detect `/dev/tdx_guest` inside the VM and upgrade to `attestation_level: td-enclave`.

The K8s manifests are ready to add `runtimeClassName: kata-cc` — the change was tested and reverted specifically because of this blocker.

## Contact

For the sandboxed containers / kata-cc runtime, the Red Hat contact is the OpenShift Sandboxed Containers team. For the Intel TDX DCAP operator, contact the Intel partner engineering team.

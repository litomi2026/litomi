#!/usr/bin/env sh
set -eu

if command -v k3s >/dev/null 2>&1; then
  echo "k3s is already installed."
else
  curl -sfL https://get.k3s.io | sudo sh -s - --write-kubeconfig-mode 644
fi

# Make kubeconfig available for the current user.
mkdir -p "$HOME/.kube"
sudo cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/config"
sudo chown "$(id -u)":"$(id -g)" "$HOME/.kube/config"
chmod 600 "$HOME/.kube/config"

echo "k3s is ready. Try: kubectl get nodes"
echo ""
echo "If kubectl shows 'current-context is not set', try:"
echo "  export KUBECONFIG=\"$HOME/.kube/config\""
echo "  unset KUBECONFIG"


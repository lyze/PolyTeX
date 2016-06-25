export function isCloudFileConnected(cloudStatus) {
  return ['loaded', 'loaded-read-only', 'dirty', 'saving', 'saved'].includes(cloudStatus);
}

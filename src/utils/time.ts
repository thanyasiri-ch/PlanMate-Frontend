export function formatSeconds(sec: number): string {
  const hrs = Math.floor(sec / 3600)
  const mins = Math.floor((sec % 3600) / 60)
  return `${hrs} hrs ${mins} mins`
}

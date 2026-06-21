import { onMounted, onUnmounted, ref } from 'vue'

export function useAutoRefresh(callback: () => void, intervalMs = 30000) {
  const enabled = ref(true)
  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    if (timer) return
    timer = setInterval(() => {
      if (enabled.value) callback()
    }, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function toggle() {
    enabled.value = !enabled.value
  }

  onMounted(start)
  onUnmounted(stop)

  return { enabled, start, stop, toggle }
}


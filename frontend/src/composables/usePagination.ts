import { ref, computed } from 'vue'

export function usePagination(totalItems: Ref<number>, itemsPerPage = 20) {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

  const offset = computed(() => (currentPage.value - 1) * itemsPerPage)

  function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  function prevPage() {
    if (currentPage.value > 1) currentPage.value--
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) currentPage.value = page
  }

  return { currentPage, totalPages, offset, nextPage, prevPage, goToPage }
}

import type { Ref } from 'vue'


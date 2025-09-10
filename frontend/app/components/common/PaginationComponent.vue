<!-- components/common/PaginationComponent.vue -->
<script setup lang="ts">
interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageOffset?: number
  maxVisible?: number
  showIfSinglePage?: boolean
}

const props = withDefaults(defineProps<PaginationProps>(), {
  pageOffset: 10,
  maxVisible: 5,
  showIfSinglePage: false
})

const route = useRoute()

const shouldShow = computed(() => {
  if (props.showIfSinglePage) {
    return props.totalCount > 0
  }
  return props.totalCount > 0 && props.totalPages > 1
})

const visiblePages = computed(() => {
  if (props.totalPages < 1) return []

  if (props.totalPages === 1) {
    return [1]
  }

  const maxVisible = props.maxVisible
  const total = props.totalPages
  const current = props.currentPage

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pageOffset = Math.floor(maxVisible / 2)
  let startPage = current - pageOffset
  let endPage = current + pageOffset

  if (startPage < 1) {
    startPage = 1
    endPage = maxVisible
  }
  if (endPage > total) {
    endPage = total
    startPage = total - maxVisible + 1
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
})
</script>

<template>
  <div class="pagination" v-if="shouldShow">
    <template v-if="props.currentPage === 1">
      <span class="start btn_arrow disabled" aria-disabled="true" tabindex="-1">
        <i></i><span class="sr-only">처음</span>
      </span>
    </template>
    <template v-else>
      <NuxtLink :to="{ query: { ...route.query, current_page: 1 } }" class="start btn_arrow">
        <i></i><span class="sr-only">처음</span>
      </NuxtLink>
    </template>

    <!-- 이전 -->
    <template v-if="props.currentPage === 1">
      <span class="before btn_arrow disabled" aria-disabled="true" tabindex="-1">
        <i></i><span class="sr-only">&lt;</span>
      </span>
    </template>
    <template v-else>
      <NuxtLink :to="{ query: { ...route.query, current_page: props.currentPage - 1 } }" class="before btn_arrow">
        <i></i><span class="sr-only">&lt;</span>
      </NuxtLink>
    </template>

    <!-- 페이지 번호 -->
    <template v-for="pageNum in visiblePages" :key="pageNum">
      <NuxtLink
          :to="{ query: { ...route.query, current_page: pageNum } }"
          class="page"
          :class="{ active: pageNum === props.currentPage }"
          :aria-current="pageNum === props.currentPage ? 'page' : undefined"
          :aria-label="pageNum === props.currentPage ? `현재 ${pageNum} 페이지` : `${pageNum} 페이지로 이동`"
      >
        {{ pageNum }}
      </NuxtLink>
    </template>

    <!-- 다음 -->
    <template v-if="props.currentPage === props.totalPages">
      <span class="next btn_arrow disabled" aria-disabled="true" tabindex="-1">
        <i></i><span class="sr-only">&gt;</span>
      </span>
    </template>
    <template v-else>
      <NuxtLink :to="{ query: { ...route.query, current_page: props.currentPage + 1 } }" class="next btn_arrow">
        <i></i><span class="sr-only">&gt;</span>
      </NuxtLink>
    </template>

    <!-- 마지막 -->
    <template v-if="props.currentPage === props.totalPages">
      <span class="end btn_arrow disabled" aria-disabled="true" tabindex="-1">
        <i></i><span class="sr-only">마지막</span>
      </span>
    </template>
    <template v-else>
      <NuxtLink :to="{ query: { ...route.query, current_page: props.totalPages } }" class="end btn_arrow">
        <i></i><span class="sr-only">마지막</span>
      </NuxtLink>
    </template>
  </div>
</template>

<style scoped>
/* pagination */
.pagination { margin: 20px auto 0; text-align: center; }

/* 공통 크기/정렬 */
.pagination .page,
.pagination .btn_arrow { display: inline-block; width: 38px; height: 38px; line-height: 38px; vertical-align: middle; text-align: center;color: #707070; }

/* 페이지 번호 */
.pagination .page.active { text-decoration: underline; color: #000; font-weight: bold; }

/* 화살표 공통 박스 */
.pagination .btn_arrow { border: 1px solid #e0e0e0; border-radius: 50%; overflow: hidden; background-color: #fff; text-indent: -999px;}

/* 아이콘 배경 (요소 종류와 무관하게 클래스 기준) */
.pagination .before  { background: url('~/assets/images/common/icon-prev.svg')  no-repeat center; }
.pagination .next    { background: url('~/assets/images/common/icon-next.svg')  no-repeat center; }
.pagination .end     { background: url('~/assets/images/common/icon-last.svg')  no-repeat center; }
.pagination .start   { background: url('~/assets/images/common/icon-first.svg') no-repeat center; }

/* 비활성 상태 (a/span 공통) */
.pagination .btn_arrow.disabled { pointer-events: none; cursor: default; color: #ccc; background-color: #f5f5f5;border-color: #e0e0e0; }

/* 접근성 텍스트 숨김 (필요 시) */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
<!-- pages/community/notice/index.vue -->
<script setup lang="ts">
interface NoticeItem {
  idx: number
  title: string
  reg_stamp: number
  is_top: 'Y' | 'N'
}

interface NoticeListData {
  notice_list: NoticeItem[]
  notice_cnt: number
  offset: number
  current_page: number
  total_pages: number
}

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

// 반응형 데이터
const noticeList = ref<NoticeItem[]>([])
const totalCount = ref(0)
const currentPage = ref(Number(route.query.current_page) || 1)
const totalPages = ref(1)
const pageOffset = ref(10)

// 검색 파라미터
const searchParams = reactive({
  word: (route.query.word as string) || '', // 초기값을 URL에서 가져오기
  offset: 10,
  current_page: 1,
  lang: locale.value
})

// 초기화
onMounted(async () => {
  currentPage.value = Number(route.query.current_page) || 1
  searchParams.word = (route.query.word as string) || ''
  searchParams.current_page = currentPage.value
  await loadNoticeList()
})

// 언어 변경 감지
watch(() => locale.value, async () => {
  // 언어가 변경되면 첫 페이지부터 다시 로드
  searchParams.lang = locale.value
  currentPage.value = 1
  searchParams.current_page = 1
  await loadNoticeList()
})

// URL 쿼리 변경 감지
watch(() => route.query, (newQuery) => {
  const pageNumber = Number(newQuery.current_page) || 1
  const searchWord = (newQuery.word as string) || ''

  if (pageNumber !== currentPage.value) {
    currentPage.value = pageNumber
    searchParams.current_page = pageNumber
  }

  if (searchWord !== searchParams.word) {
    searchParams.word = searchWord
  }

  loadNoticeList()
}, { deep: true })

// 공지사항 목록 로드
const loadNoticeList = async () => {
  const apiParams = {
    word: searchParams.word,
    offset: searchParams.offset,
    current_page: currentPage.value,
    lang: searchParams.lang
  }

  const response = await useApiGet<NoticeListData>('/community/getNoticeList', apiParams)

  if (response.status === 'success') {
    noticeList.value = response.data.notice_list
    totalCount.value = response.data.notice_cnt
    pageOffset.value = response.data.offset
    totalPages.value = Math.ceil(response.data.notice_cnt / response.data.offset)
  } else {
    handleApiError(response.data)

    // 기본값 설정
    noticeList.value = []
    totalCount.value = 0
    totalPages.value = 1
  }
}

// 검색 실행
const searchNotices = async () => {
  const query: any = { current_page: 1 }

  // 검색어가 있으면 쿼리에 포함
  if (searchParams.word.trim()) {
    query.word = searchParams.word.trim()
  }

  await router.push({ query })
}

// 표시 번호 계산
const getDisplayNumber = (index: number) => {
  return totalCount.value - (pageOffset.value * (currentPage.value - 1)) - index
}

</script>

<template>
  <div id="container" class="community">
    <CommunityTabComponent />
    <div class="cont_area">
      <div class="history amsb">
        <div class="list_total">{{ t('community_tab_05') }} <b id="notice_total_cnt">{{ totalCount }}</b> {{ t('community_tab_06') }}</div>
        <div class="list_search">
          <span class="search_wrap">
            <input
                type="search"
                id="search_word"
                v-model="searchParams.word"
                @keyup.enter="searchNotices"
                :placeholder="t('community_tab_07')"
            >
            <button @click="searchNotices" id="search_total_btn"></button>
          </span>
        </div>
      </div>

      <div class="notice_table notice_list">
        <div class="table">
          <!-- 공지사항 목록 -->
          <template v-if="noticeList.length > 0">
            <ul
                class="ul_tr"
                v-for="(notice, index) in noticeList"
                :key="notice.idx"
            >
              <li class="num" :class="{ fixed: notice.is_top === 'Y' }">
                <i v-if="notice.is_top === 'Y'"></i>
                <template v-else>{{ getDisplayNumber(index) }}</template>
              </li>
              <li class="title">
                <NuxtLink :to="`/community/notice/detail/${notice.idx}`">
                  {{ notice.title }}
                </NuxtLink>
              </li>
              <li class="date">{{ formatDateDash(notice.reg_stamp) }}</li>
            </ul>
          </template>

          <!-- 데이터가 없을 때 -->
          <template v-else>
            <ul class="ul_tr no-data">
              <li colspan="3">
                <div>
                  <p>공지사항이 없습니다.</p>
                </div>
              </li>
            </ul>
          </template>
        </div>

        <!-- 페이지네이션 컴포넌트 -->
        <PaginationComponent
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-count="totalCount"
            :page-offset="pageOffset"
        />
      </div>
    </div>
  </div>
</template>
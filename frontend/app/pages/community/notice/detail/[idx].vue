<!-- pages/community/notice/detail/[idx].vue -->
<script setup lang="ts">

interface NoticeDetailData {
  idx: number
  title: string
  contents: string
  is_html: 'Y' | 'N'
  reg_stamp: string
  full_file_path?: string
  full_file_path_resize?: string
  name_origin?: string
  file_path?: string
  prev_idx?: number
  prev_title?: string
  next_idx?: number
  next_title?: string
}

const { locale, t: $t } = useI18n()
const route = useRoute()

const idx = Number(route.params.idx ?? '')
if (isNaN(idx) || idx <= 0 || !Number.isInteger(idx)) {
  await navigateTo('/')
}

const noticeDetail = ref<NoticeDetailData | null>(null)

const loadNoticeDetail = async () => {
  const response = await useApi<NoticeDetailData>('/community/getNoticeDetail', {
    idx: idx,
    lang: locale.value
  })

  if (response.status === 'success') {
    noticeDetail.value = response.data
  } else {
    handleApiError(response.data)
    await navigateTo('/community/notice')
  }
}

// 파일 다운로드
const downloadFile = async () => {
  if (!noticeDetail.value?.file_path || !noticeDetail.value?.name_origin) {
    console.warn('No file available for download.')
    return
  }

  await backendFileDownload(
      noticeDetail.value.file_path,
      noticeDetail.value.name_origin
  )
}

// 초기화
onMounted(async () => {
  await loadNoticeDetail()
})

// 언어 변경 감지
watch(() => locale.value, async () => {
  await navigateTo('/community/notice')
})

// 라우트 파라미터 변경 감지
watch(() => route.params.idx, async (newIdx) => {
  if (newIdx && parseInt(newIdx as string) !== idx) {
    await loadNoticeDetail()
  }
}, { immediate: true })
</script>

<template>
  <div id="container" class="community">
    <div class="brd_wrap notice_detail">
      <div class="cont_area">
        <!-- 상세 내용 -->
        <template v-if="noticeDetail">
          <div class="brd_head">
            <div class="tit">
              <p>{{ noticeDetail.title }}</p>
            </div>
            <p class="date">{{ formatDateTimeDash(noticeDetail.reg_stamp) }}</p>
          </div>

          <div class="brd_body">
            <div class="detail">
              <div v-html="noticeDetail.contents"></div>
            </div>
          </div>

          <!-- 첨부파일 -->
          <div v-if="noticeDetail.file_path && noticeDetail.name_origin" class="brd_file">
            <p>
              <i class="icon_file">
                <img src="/img/common/icon-file.svg" alt="">
              </i>
              <button type="button" @click="downloadFile">
                <span>{{ noticeDetail.name_origin }}</span>
              </button>
            </p>
          </div>

          <!-- 이전/다음 공지사항 -->
          <div class="brd_list">
            <ul>
              <li v-if="noticeDetail.prev_idx" class="brd_prev">
                <span>{{ $t('common_21') }}</span>
                <div class="icon_arrow"></div>
                <p>
                  <NuxtLink :to="`/community/notice/detail/${noticeDetail.prev_idx}`">
                    {{ noticeDetail.prev_title }}
                  </NuxtLink>
                </p>
              </li>

              <li v-if="noticeDetail.next_idx" class="brd_next">
                <span>{{ $t('common_20') }}</span>
                <div class="icon_arrow"></div>
                <p>
                  <NuxtLink :to="`/community/notice/detail/${noticeDetail.next_idx}`">
                    {{ noticeDetail.next_title }}
                  </NuxtLink>
                </p>
              </li>
            </ul>
          </div>

          <div class="brd_footer">
            <div class="btn_box">
              <NuxtLink to="/community/notice" class="btn_black_line">
                {{ $t('common_19') }}
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>


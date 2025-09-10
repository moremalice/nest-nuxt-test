<!-- components/HeaderComponent.vue -->
<script setup lang="ts">
const { locale, setLocale, t } = useI18n()
setupHeaderUI()

// 메뉴 타입 정의
interface MenuItem {
  title: string
  href: string
  subItems?: SubItem[]
}

interface SubItem {
  title: string
  href: string
}

// 언어 목록
const languages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'id', name: 'Indonesia' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'th', name: 'ไทย' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'zh_s', name: '简体中文' },
  { code: 'zh_t', name: '繁體中文' }
] as const
type LocaleCode = (typeof languages)[number]['code']

// 메뉴 데이터 computed로 다국어 반응성 확보 및 최적화
const menuItems = computed((): MenuItem[] => {
  const _ = locale.value // 의존성 명확화
  return [
    {
      title: 'PikiTalk',
      href: '/',
      subItems: [
        { title: t('common_14'), href: '#intro' },
        { title: t('common_15'), href: '#functions' },
        { title: t('common_16'), href: '#features' },
      ],
    },
    {
      title: 'Customer Support',
      href: '/community/notice',
      subItems: [
        { title: t('community_tab_01'), href: '/community/notice' },
        { title: t('common_17'), href: '/community/faq' },
      ],
    },
  ]
})

// 언어 변경
const setLanguage = async (langCode: LocaleCode) => {
  handleLanguageListClose()
  try {
    await setLocale(langCode)
  } catch (error) {
    if (import.meta.client) {
      showToastMessage('언어 변경에 실패했습니다. 다시 시도해 주세요.')
    }
  }
}
</script>

<template>
  <header id="header">
    <div class="header_wrap">
      <!-- 로고 nuxtlink 대신 a -->
      <h1 id="logo">
        <a href="/" title="main">
          <img src="~/assets/images/common/logo_piki.svg" alt="piki" />
        </a>
      </h1>

      <!-- 네비게이션 -->
      <nav id="nav" :class="{ active: getMobileMenuOpenState() }" role="navigation" aria-label="Main navigation">
        <div class="nav_wrap">
          <ul class="depth1" role="menubar">
            <li v-for="(item, index) in menuItems" :key="index" class="depth1_li" :class="{ on: hasActiveMenuItem(index) }" role="none">
              <!-- 메인 메뉴 -->
              <NuxtLink 
                :to="item.href" 
                class="depth1_a" 
                role="menuitem"
                :aria-expanded="item.subItems?.length ? isDesktopOrHasActiveMenuItem(index) : undefined"
                :aria-haspopup="item.subItems?.length ? 'true' : undefined"
                @click="handleMainMenuClick($event, item, index)"
                @keydown.space.enter.prevent="handleMainMenuClick($event, item, index)"
              >
                {{ item.title }}
              </NuxtLink>
              <!-- 서브메뉴 -->
              <ul 
                v-if="item.subItems?.length" 
                class="depth2" 
                :class="{ show: isDesktopOrHasActiveMenuItem(index) }"
                role="menu"
                :aria-label="`${item.title} submenu`"
              >
                <li v-for="subItem in item.subItems" :key="subItem.href" role="none">
                  <NuxtLink 
                    :to="getSubItemLink(subItem.href)" 
                    role="menuitem"
                    @click="handleAnchorClick($event, subItem.href)"
                    @keydown.enter="handleAnchorClick($event, subItem.href)"
                  >
                    {{ subItem.title }}
                  </NuxtLink>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>

      <!-- 유틸리티 -->
      <div class="util">
        <!-- 모바일 메뉴 버튼 -->
        <button 
          id="BtnGnbM" 
          @click="handleMobileMenuToggle" 
          :class="{ close: getMobileMenuOpenState() }"
          :aria-expanded="getMobileMenuOpenState()"
          aria-controls="nav"
          :aria-label="getMobileMenuOpenState() ? 'Close mobile menu' : 'Open mobile menu'"
        >
          <span></span>
        </button>
        <!-- 언어 선택 -->
        <div id="lang">
          <button 
            @click="handleLanguageListToggle"
            :aria-expanded="getLanguageListOpenState()"
            aria-haspopup="listbox"
            aria-label="Select language"
            :aria-describedby="'current-language-' + locale"
          >
            <img src="~/assets/images/common/icon_language.svg" alt="" role="presentation" />
          </button>
          <div 
            class="list" 
            :class="{ show: getLanguageListOpenState() }"
            role="listbox"
            :aria-label="'Language selection'"
          >
            <ul role="group">
              <li 
                v-for="language in languages" 
                :key="language.code" 
                :class="{ on: locale === language.code }" 
                role="option"
                :aria-selected="locale === language.code"
                :id="locale === language.code ? 'current-language-' + locale : undefined"
                tabindex="0"
                @click="setLanguage(language.code)"
                @keydown.enter.space.prevent="setLanguage(language.code)"
              >
                {{ language.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

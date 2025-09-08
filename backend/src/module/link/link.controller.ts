// backend/src/module/link/link.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('WEB')
@Controller('link')
export class LinkController {
  @ApiOperation({
    summary: '피키톡 앱 URL 반환',
    description: '모바일/데스크톱에 따른 URL 반환',
  })
  @ApiResponse({ status: 200, description: 'URL 반환 성공' })
  @Get('pikitalk-app')
  getPikitalkAppUrl(@Req() req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );

    if (isMobile) {
      const deepLink =
        'https://pikitalk.page.link/?amv=0&apn=sigmachain.app.pikitalk&isi=6474581597&ibi=sigmachain.app.pikitalk&imv=0&link=https%3A%2F%2Fsigmachain.app.pikitalk%2Fnull';
      return { redirectUrl: deepLink };
    } else {
      const playStoreLink =
        'https://play.google.com/store/apps/details?id=sigmachain.app.pikitalk';
      return { redirectUrl: playStoreLink };
    }
  }

  @ApiOperation({
    summary: '피키 앱 URL 반환',
    description: '모바일/데스크톱에 따른 URL 반환',
  })
  @ApiResponse({ status: 200, description: 'URL 반환 성공' })
  @Get('piki-app')
  getPikiAppUrl(@Req() req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );

    if (isMobile) {
      const deepLink =
        'https://pikiplace.page.link/?amv=0&apn=sigmachain.app.piki&isi=6447415477&ibi=sigmachain.app.piki&imv=0&link=https%3A%2F%2Fsigmachain.app.piki';
      return { redirectUrl: deepLink };
    } else {
      const playStoreLink =
        'https://play.google.com/store/apps/details?id=sigmachain.app.piki';
      return { redirectUrl: playStoreLink };
    }
  }
}

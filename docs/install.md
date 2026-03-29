<!--
Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
SPDX-License-Identifier: CC0-1.0
-->

# 설치 안내

## 프로젝트 생성

1. [GitHub 회원가입](https://github.com/signup) 후 로그인

2. Vercel에서 새 프로젝트 생성:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjuyuwol%2Fowlbox%2Ftree%2Fdeploy&env=USERNAME,PASSWORD&project-name=owlbox&repository-name=owlbox)

3. Git provider로 *GitHub*을 선택, 새 창이 뜨면, *Authorize Vercel*를 클릭해 권한을 부여합니다.

4. *Verification* 페이지로 전환되면, 국기 아이콘을 클릭해 ‘South Korea (대한민국) +82’를 선택하고, 첫 자리의 0을 제외한 휴대전화번호를 입력해 문자 인증을 진행합니다. 예: 전화번호가 010-1234-5678일 때 1012345678 입력하기

5. *New Project* 페이지로 돌아오면, *Git Scope* 아래의 *Select Git Scope* 란을 클릭, 선택란이 확장되면 *+ Add GitHub Account*를 클릭, *Install Vercel*로 시작하는 창이 뜨면 *Install*을 클릭합니다.

6. *New Project* 페이지로 돌아오면, *Create*를 클릭해 프로젝트를 생성합니다.

7. *Add Enviroment Variables* 부문에서 `USERNAME`과 `PASSWORD`의 값을 입력합니다. 각각 사서함에서 관리 페이지에 접속할 때 사용할 아이디와 비밀번호가 됩니다.

    - 값을 일방향 암호화 없이 저장하기 때문에, 반드시 평소 사용하는 다른 웹서비스와 다른 것을 사용해야 합니다. 완전히 랜덤한 값으로 설정하고, 브라우저의 비밀번호 관리자 기능을 통해 로그인하는 것을 강력하게 권장합니다.

    - [Basic Auth Credentials Generator](https://juyuwol.github.io/random-basic-auth/)를 활용해 보세요. 제약 조건을 충족하는 랜덤한 아이디/비밀번호를 생성합니다.

    - 제약 조건: 제어 문자를 제외한 US-ASCII 문자(대/소 영문자, 숫자, 특수 문자 `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~``)만이 허용됩니다. 단, `USERNAME`에 `:` 문자는 사용할 수 없습니다. 또한 길이는 255자를 초과하지 않는 것이 좋습니다.

8. *Deploy* 버튼을 클릭해 사이트 생성을 시작합니다.

9. 잠시 후 사이트 생성이 끝나 페이지가 전환되면, *Continue to Dashboard*를 클릭해 프로젝트 대시보드로 이동합니다.

   Vercel에서 웹사이트를 호스팅하기 때문에, Vercel 프로젝트 대시보드는 사서함을 운영하는 한 계속 들락이게 되는 곳입니다. 앞으로 Vercel 프로젝트 대시보드라 하면 이곳을 의미합니다.

10. *Storage* 메뉴로 이동하고, 목록에서 *Upstash*를 선택, 펼쳐진 하위 목록 중 *Upstash for Redis* 옆의 *Create*를 선택합니다. *Create New Upstash Account*로 시작하는 약관 안내가 나오면 *Accept and Create*를 클릭해 다음으로 진행합니다.

11. *Plans*에서 *Free* 선택, *Continue*로 진행, *Database Name*은 자동 기입된 것을 그대로 두어도 됩니다. *Create*를 클릭해 데이터베이스를 생성합니다. *Database Created Successfully*로 시작하는 성공 안내가 뜨면 *Done*을 클릭해 데이터베이스 설정 페이지로 이동합니다.

12. *Connect Project* 버튼을 클릭, 선택란이 확장되면 *Search Projects...* 란을 클릭, 이번에 생성한 *owlbox*(혹은 따로 설정한 프로젝트 이름) 프로젝트를 선택하고 *Connect*를 클릭해 데이터베이스를 프로젝트에 연결합니다.

13. Vercel 프로젝트 대시보드는 잠시 그대로 두고, 새 창에서 GitHub의 *Settings* / *Developer Settings* / *Personal access tokens* / *Fine-grained tokens* / *[Generate new token](https://github.com/settings/personal-access-tokens/new)* 페이지를 엽니다.

14. *Token name*에는 `OwlBox`(혹은 원하는 아무거나)를 입력하고, *Expiration*을 *No expiration*으로 선택합니다. *Repository access*에서 *Only select repositories*를 선택하고, 선택란이 확장되면 이번에 생성한 *owlbox*(혹은 따로 설정한 리포지토리 이름)를 선택합니다. *Permissions* 아래의 *Repository permissions*를 클릭해 열고, *Contents* 부문에서 *Read and Write*를 선택합니다.

15. *Generate token* 클릭, 확인 창이 뜨면 다시 *Generate token*을 클릭, 페이지가 전환되면 나타난 토큰 값을 복사합니다.

16. Vercel 프로젝트 대시보드로 돌아와, *Settings* 메뉴 / *Environment Variables* 탭으로 이동합니다.

17. Key: `GITHUB_TOKEN`, *Value*: 복사한 GitHub 토큰 값 각각을 입력하고, *Save*를 눌러 저장합니다.

18. ‘Added Environment Variable successfully.’로 시작하는 안내문이 페이지 구석에 뜨면, 그 안의 *Redeploy* 버튼을 클릭합니다.

    *Redeploy*로 시작하는 창이 크게 뜨면, 맨 아래의 *Use existing Build Cache* 옆 체크박스를 선택한 뒤 *Redeploy* 버튼을 클릭해 사이트 전체를 재생성합니다.

19. 창이 닫히고 페이지 구석에 작은 안내문이 뜨면, 그 안의 *View Deployment* 버튼을 클릭해 이번 배포의 *Deployment Details* 페이지로 이동합니다. 그리고 *Status*가 *Ready*로 바뀔 때까지 기다립니다.

20. 이 페이지에서 *Domains* 부문 아래의 첫 번째 URL이 설치한 사서함의 주소입니다. 프로젝트 대시보드 *Settings* 메뉴 / *Domains* 탭에서 도메인을 다른 `.vercel.app`으로 끝나는 도메인으로 변경할 수 있습니다.

21. 사서함 설치가 끝났습니다. 사서함 메인 페이지 상단에 관리 페이지로 가는 로그인 링크가 있습니다. 로그인 후 설정 페이지에 들어가서 설정을 조정할 수 있습니다.

## 이메일 연동

쪽지가 올 때 이메일 알림이 오도록 설정하려면 아래의 이메일 발송자별 연동 절차를 거쳐야 합니다.

- Google Apps Script 연동
   - Google 계정 필요
   - 도메인을 따로 구입할 필요가 없음

- Resend 연동
   - 개인 소유 도메인, Resend 회원가입 필요
   - 동작이 좀 더 안정적이고 빠름
   - Google이 아님

[Resend Free Plan](https://resend.com/pricing), [Google 일반 사용자의 서비스 할당량](https://developers.google.com/apps-script/guides/services/quotas) 모두 하루 100건까지의 이메일 발송을 허용하고 있습니다. (2025년 7월 15일 기준)

### Google Apps Script 연동

1. [Google Apps Script](https://script.google.com) 이동

   필요 시, 이메일을 발송할 Google 계정으로 계정을 전환합니다.

2. ‘새 프로젝트’를 클릭해 프로젝트 편집자를 엽니다.

   여기서 관리상의 편의를 위해, 프로젝트 이름의 기본값 `제목 없는 프로젝트`를 `OwlBox`로 변경하는 것을 권장합니다.

3. *Code.gs* 스크립트의 모든 내용을 지우고, 아래의 코드로 대체합니다.

   ``` javascript
   // Copyright 2025 Ju Yuwol <ju@yuwol.pe.kr>
   // SPDX-License-Identifier: 0BSD

   // https://developers.google.com/apps-script/guides/web
   function doPost(e) {
     // https://developers.google.com/apps-script/reference/mail/mail-app
     MailApp.sendEmail(JSON.parse(e.postData.contents));

     // https://developers.google.com/apps-script/reference/content
     return ContentService.createTextOutput('{"ok":true}\n').setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. 저장 아이콘(‘Drive에 프로젝트 저장’) 클릭

5. ‘배포(이 프로젝트 배포)’ / ‘새 배포’ 클릭

6. ‘유형 선택’ 옆의 설정 아이콘(‘배포 유형 사용 설정’) / ‘웹 앱’ 선택

7. ‘액세스 권한이 있는 사용자’를 ‘모든 사용자’로 설정하고, ‘배포’ 버튼을 클릭합니다.

8. ‘웹 앱에서 내 데이터에 대한 액세스 권한 부여를 나에게 요청합니다.’ 안내문이 뜨면 ‘액세스 승인’을 클릭합니다.

9. 새 창에 로그인 페이지가 뜨면 계정을 선택합니다.

10. ‘Google hasn’t verified this app’ 경고문이 뜨면, 아래의 작은 회색 문구 *Advanced*를 클릭합니다.

    이후 페이지 아래에 나타난 작은 회색 링크 ‘Go to OwlBox (unsafe)’를 클릭합니다. (프로젝트 이름을 권장 사항과 다르게 설정했다면, OwlBox 부분은 설정한 프로젝트 이름이 됩니다.)

11. 허용 여부를 묻는 페이지가 뜨면, 페이지 하단의 *Allow*를 클릭합니다.

    ‘페이지가 제대로 리디렉션되지 않음’ 경고문으로 페이지가 전환된다면, 직접 창을 닫으면 정상 진행됩니다.

12. ‘웹 앱’ 부문의 URL 복사

13. Vercel 프로젝트 대시보드 / *Settings* 메뉴 / *Environment Variables* 탭 이동

14. *Create new* 부문 하단의 입력란에, Key: `APPS_SCRIPT_URL`, Value: 복사한 URL 각각을 입력하고, *Save*를 클릭해 저장합니다.

15. ‘Added Environment Variable successfully.’로 시작하는 안내문이 페이지 구석에 뜨면, 그 안의 *Redeploy* 버튼을 클릭합니다.

    *Redeploy*로 시작하는 창이 크게 뜨면, 맨 아래의 *Use existing Build Cache* 옆 체크박스를 선택한 뒤 *Redeploy* 버튼을 클릭해 사이트 전체를 재생성합니다.

## Resend 연동

1. [Resend](https://resend.com/) 회원가입

   GitHub 계정을 연동해 빠르게 가입할 수 있습니다.

2. *[Domains](https://resend.com/domains)* 메뉴에서 *Add Domain*을 눌러 보유한 도메인을 등록합니다. 등록 절차는 Resend 내 안내를 따라 주세요.

3. *[API Keys](https://resend.com/api-keys)* 메뉴에서 *Create API Key*를 클릭합니다. *Name*은 `OwlBox`(혹은 원하는 아무거나), *Permission*은 *Sending access*, *Domain*은 방금 등록한 도메인을 선택, *Add*를 눌러 API 키를 생성합니다.

4. 생성된 API 키 값을 복사합니다.

5. Vercel 프로젝트 대시보드 / *Settings* 메뉴 / *Environment Variables* 탭 이동

6. *Create new* 부문 하단의 입력란에 다음의 두 변수를 입력하고, *Save*를 클릭해 저장합니다.

   - Key: `RESEND_API_KEY`, Value: 복사한 API 키 값

   - Key: `RESEND_DOMAIN`, Value: Resend에 등록한 도메인 (예: `example.com`)

7. ‘Added Environment Variable successfully.’로 시작하는 안내문이 페이지 구석에 뜨면, 그 안의 *Redeploy* 버튼을 클릭합니다.

    *Redeploy*로 시작하는 창이 크게 뜨면, 맨 아래의 *Use existing Build Cache* 옆 체크박스를 선택한 뒤 *Redeploy* 버튼을 클릭해 사이트 전체를 재생성합니다.

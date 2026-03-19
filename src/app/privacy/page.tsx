export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-screen-md px-5 py-10">
      <h1 className="text-[22px] font-bold text-foreground mb-6">
        개인정보처리방침
      </h1>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-2">
        시행일: 2026년 3월 19일
      </p>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        SALog(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 여기며,
        「개인정보 보호법」 및 관련 법령을 준수합니다. 본 개인정보처리방침은
        서비스가 수집하는 개인정보의 항목, 수집 목적, 보유 기간, 제3자 제공
        등에 관한 사항을 안내합니다.
      </p>

      {/* 제1조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제1조 (수집하는 개인정보 항목)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-3">
        서비스는 회원가입 및 서비스 이용 과정에서 다음의 개인정보를 수집합니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          <strong>카카오 로그인 정보:</strong> 카카오 계정 고유 식별자(ID),
          프로필 닉네임, 프로필 이미지, 이메일 주소
        </li>
        <li>
          <strong>병영주소(서든어택 계정 정보):</strong> 서든어택 병영주소,
          인증 여부, 인증 일시
        </li>
        <li>
          <strong>서비스 이용 기록:</strong> 신고 작성 내역, 투표 기록, 댓글
          내역, 매너 신고 내역, 블랙리스트 조회 기록
        </li>
        <li>
          <strong>자동 수집 정보:</strong> 접속 IP 주소, 브라우저 종류,
          접속 일시, 쿠키 정보
        </li>
      </ul>

      {/* 제2조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제2조 (개인정보의 수집 및 이용 목적)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          <strong>회원 관리:</strong> 회원 식별, 가입 및 탈퇴 처리, 본인 확인,
          부정 이용 방지
        </li>
        <li>
          <strong>병영주소 인증:</strong> 서든어택 계정 소유자 확인, 신고 및
          투표 권한 부여
        </li>
        <li>
          <strong>서비스 제공:</strong> 핵 사용자 신고 시스템 운영, 투표 기능
          제공, 블랙리스트 관리, 닉네임 변경 추적, 매너 신고 처리
        </li>
        <li>
          <strong>알림 서비스:</strong> Discord 웹훅을 통한 신고 상태 변경
          알림, 투표 결과 알림
        </li>
        <li>
          <strong>서비스 개선:</strong> 이용 통계 분석, 서비스 품질 향상,
          부정 행위 탐지
        </li>
        <li>
          <strong>분쟁 해결:</strong> 민원 처리, 분쟁 조정을 위한 기록 보존
        </li>
      </ul>

      {/* 제3조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제3조 (개인정보의 보유 및 이용 기간)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          <strong>회원 정보:</strong> 회원 탈퇴 시까지 보유하며, 탈퇴 후 지체
          없이 파기합니다. 단, 부정 이용 방지를 위해 카카오 계정 식별자 및
          병영주소는 탈퇴 후 30일간 보관 후 파기합니다.
        </li>
        <li>
          <strong>신고 및 투표 기록:</strong> 서비스의 공익적 목적(핵 사용자
          추적)을 위해 회원 탈퇴 후에도 익명화하여 보존될 수 있습니다.
        </li>
        <li>
          <strong>접속 기록:</strong> 「통신비밀보호법」에 따라 3개월간
          보관합니다.
        </li>
        <li>
          <strong>분쟁 관련 기록:</strong> 「전자상거래 등에서의 소비자보호에
          관한 법률」에 따라 소비자 불만 및 분쟁 처리 기록은 3년간 보관합니다.
        </li>
      </ul>

      {/* 제4조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제4조 (개인정보의 제3자 제공)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-3">
        서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만,
        다음의 경우에는 예외로 합니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령에 의해 요구되는 경우</li>
        <li>
          수사 목적으로 법령에 정해진 절차에 따라 수사기관의 요구가 있는 경우
        </li>
      </ul>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-3">
        서비스는 넥슨 Open API를 통해 서든어택 플레이어의 공개 게임 데이터
        (닉네임, 전적, 병영주소 등)를 조회합니다. 이 과정에서 이용자의
        개인정보가 넥슨에 전송되지 않으며, 넥슨 API에서 제공하는 공개 정보만을
        수신합니다.
      </p>

      {/* 제5조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제5조 (개인정보 처리 위탁)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          <strong>카카오:</strong> 소셜 로그인 인증 처리 (카카오 로그인 API)
        </li>
        <li>
          <strong>Vercel:</strong> 웹 서비스 호스팅 및 서버 운영
        </li>
      </ul>

      {/* 제6조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제6조 (이용자의 권리 및 행사 방법)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-3">
        이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>개인정보 열람 요구</li>
        <li>개인정보 정정 및 삭제 요구</li>
        <li>개인정보 처리 정지 요구</li>
        <li>회원 탈퇴 (서비스 내 설정에서 직접 처리 가능)</li>
      </ul>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-3">
        위 권리 행사는 서비스 내 설정 페이지 또는 salog.official@gmail.com을
        통해 요청할 수 있으며, 본인 확인 후 지체 없이 처리합니다.
      </p>

      {/* 제7조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제7조 (쿠키의 사용)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          서비스는 로그인 세션 유지, 사용자 환경 설정 저장 등을 위해 쿠키를
          사용합니다.
        </li>
        <li>
          쿠키는 이용자의 브라우저에 저장되는 소량의 데이터로, 서비스 이용을
          원활하게 하기 위해 활용됩니다.
        </li>
        <li>
          이용자는 브라우저 설정을 통해 쿠키의 저장을 거부하거나 삭제할 수
          있습니다. 다만, 쿠키 저장을 거부할 경우 로그인이 필요한 서비스
          이용에 제한이 있을 수 있습니다.
        </li>
      </ul>

      {/* 제8조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제8조 (개인정보의 파기)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이
          파기합니다.
        </li>
        <li>
          전자적 파일 형태의 개인정보는 복구할 수 없는 방법으로 영구
          삭제합니다.
        </li>
        <li>
          종이 문서에 기록된 개인정보는 분쇄하거나 소각하여 파기합니다.
        </li>
      </ul>

      {/* 제9조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제9조 (개인정보의 안전성 확보 조치)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>개인정보는 암호화하여 저장 및 전송합니다 (HTTPS/TLS).</li>
        <li>
          데이터베이스 접근 권한을 최소한으로 제한하고, 접근 기록을
          관리합니다.
        </li>
        <li>
          정기적인 보안 점검을 실시하여 개인정보 유출을 방지합니다.
        </li>
      </ul>

      {/* 제10조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제10조 (개인정보 보호책임자)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>서비스명: SALog</li>
        <li>이메일: salog.official@gmail.com</li>
      </ul>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-3">
        개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수
        있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-2">
        <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
        <li>대검찰청 사이버수사과 (spo.go.kr / 1301)</li>
        <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
      </ul>

      {/* 제11조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제11조 (방침의 변경)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        본 개인정보처리방침은 관련 법령 또는 서비스 정책의 변경에 따라 수정될 수
        있습니다. 변경 시 시행일 최소 7일 전에 서비스 내 공지사항 및 Discord를
        통해 안내합니다. 중요한 변경 사항(수집 항목 추가, 제3자 제공 등)의 경우
        30일 전에 사전 공지합니다.
      </p>

      <div className="mt-10 pt-6 border-t border-toss-gray-200 dark:border-toss-gray-800">
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
          본 개인정보처리방침에 대한 문의사항은 아래 연락처로 보내주시기
          바랍니다.
        </p>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-2">
          이메일: salog.official@gmail.com
        </p>
      </div>
    </div>
  );
}

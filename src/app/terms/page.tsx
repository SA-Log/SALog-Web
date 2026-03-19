export default function TermsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-5 py-10">
      <h1 className="text-[22px] font-bold text-foreground mb-6">이용약관</h1>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-2">
        시행일: 2026년 3월 19일
      </p>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        본 이용약관(이하 &quot;약관&quot;)은 SALog(이하 &quot;서비스&quot;)의
        이용과 관련하여 서비스 운영자(이하 &quot;운영자&quot;)와 이용자(이하
        &quot;회원&quot;) 간의 권리, 의무, 책임사항 및 기타 필요한 사항을
        규정함을 목적으로 합니다.
      </p>

      {/* 제1조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제1조 (서비스의 정의)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          SALog는 서든어택 온라인 게임의 핵(치트) 사용자를 추적하고 기록하는
          커뮤니티 기반 플랫폼입니다.
        </li>
        <li>
          서비스는 병영주소를 기반으로 플레이어를 식별하며, 넥슨 Open API를
          통해 게임 데이터를 조회합니다.
        </li>
        <li>
          주요 기능으로는 핵 사용자 신고 및 3단계 커뮤니티 투표 시스템, 닉네임
          변경 추적(6시간 간격), 블랙리스트 관리, 매너 신고, 플레이어 전적
          조회 등이 있습니다.
        </li>
        <li>
          서비스는 카카오 로그인을 통한 회원 인증 및 Discord를 통한 알림
          기능을 제공합니다.
        </li>
      </ul>

      {/* 제2조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제2조 (약관의 효력 및 변경)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          본 약관은 서비스 화면에 게시하거나 기타 방법으로 회원에게
          공지함으로써 효력이 발생합니다.
        </li>
        <li>
          운영자는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수
          있으며, 변경 시 적용일 7일 전에 서비스 내 공지 및 Discord를 통해
          안내합니다.
        </li>
        <li>
          회원에게 불리한 약관 변경의 경우 적용일 30일 전에 사전 공지하며,
          회원이 변경 약관의 적용일까지 거부 의사를 표시하지 않으면 동의한
          것으로 간주합니다.
        </li>
      </ul>

      {/* 제3조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제3조 (회원가입 및 계정)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          회원가입은 카카오 로그인을 통해 이루어지며, 본 약관 및
          개인정보처리방침에 동의함으로써 가입이 완료됩니다.
        </li>
        <li>
          신고 작성, 투표 참여 등 핵심 기능을 이용하려면 서든어택 병영주소
          인증을 완료해야 합니다.
        </li>
        <li>
          회원은 1개의 카카오 계정으로 1개의 SALog 계정만 생성할 수 있으며,
          다중 계정 생성은 금지됩니다.
        </li>
        <li>
          회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 계정의
          부정 사용으로 인한 불이익은 회원 본인이 부담합니다.
        </li>
      </ul>

      {/* 제4조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제4조 (회원의 의무)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>회원은 본 약관 및 운영 정책을 준수해야 합니다.</li>
        <li>
          회원은 사실에 기반한 정보를 제공해야 하며, 허위 정보 기재 시 서비스
          이용이 제한될 수 있습니다.
        </li>
        <li>
          회원은 서비스 이용 과정에서 타인의 권리를 침해하거나 법령을 위반하는
          행위를 해서는 안 됩니다.
        </li>
        <li>
          회원은 서비스의 안정적 운영을 방해하는 행위(시스템 해킹, 악성코드
          유포, 비정상적 접근 등)를 해서는 안 됩니다.
        </li>
      </ul>

      {/* 제5조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제5조 (금지 행위)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-3">
        회원은 서비스 이용 시 다음 각 호의 행위를 해서는 안 됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          허위 신고: 근거 없이 다른 플레이어를 핵 사용자로 허위 신고하는 행위
        </li>
        <li>
          부정 투표: 다중 계정, 조직적 투표 조작 등을 통해 투표 결과를
          왜곡하는 행위
        </li>
        <li>
          개인정보 유출: 타인의 실명, 연락처, 주소 등 개인정보를 서비스 내에
          게시하는 행위
        </li>
        <li>
          명예훼손 및 비방: 사실 여부와 관계없이 타인의 명예를 훼손하거나
          모욕하는 행위
        </li>
        <li>
          서비스 악용: 자동화 도구(봇)를 이용한 대량 신고, 크롤링, 스크래핑
          등 비정상적 서비스 이용
        </li>
        <li>
          시스템 공격: 서버 해킹, DDoS 공격, SQL 인젝션, XSS 등 서비스
          인프라에 대한 공격
        </li>
        <li>계정 거래 및 양도: SALog 계정을 타인에게 판매, 양도하는 행위</li>
        <li>
          불법 콘텐츠 유포: 음란물, 불법 도박, 마약 등 법령에 위반되는
          콘텐츠를 게시하는 행위
        </li>
        <li>영리 목적 이용: 운영자의 사전 승인 없이 서비스를 상업적 목적으로 이용하는 행위</li>
        <li>
          기타 서비스 운영을 방해하거나 다른 회원의 정상적인 서비스 이용을
          저해하는 일체의 행위
        </li>
      </ul>

      {/* 제6조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제6조 (서비스의 제공 및 변경)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>서비스는 연중무휴 24시간 제공을 원칙으로 합니다.</li>
        <li>
          다만, 시스템 점검, 설비 보수, 기술적 장애, 천재지변, 국가비상사태
          등 불가피한 사유가 발생한 경우 서비스의 전부 또는 일부를 일시적으로
          중단할 수 있습니다.
        </li>
        <li>
          운영자는 서비스의 내용, 운영 방식, 기술적 사양 등을 변경할 수
          있으며, 중요한 변경 시 사전에 공지합니다.
        </li>
        <li>
          넥슨 Open API의 정책 변경, 서비스 중단 등 외부 요인으로 인해
          서비스의 일부 기능이 제한되거나 변경될 수 있습니다.
        </li>
      </ul>

      {/* 제7조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제7조 (지적재산권)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          서비스의 디자인, 코드, 로고, 상표, 서비스 명칭 등에 대한
          지적재산권은 운영자에게 귀속됩니다.
        </li>
        <li>
          회원이 서비스 내에 게시한 콘텐츠(신고 내용, 댓글, 증거 자료 등)의
          저작권은 해당 회원에게 귀속됩니다.
        </li>
        <li>
          다만, 운영자는 서비스 운영, 개선, 홍보 등의 목적으로 회원이 게시한
          콘텐츠를 서비스 내에서 사용할 수 있습니다.
        </li>
        <li>
          서든어택 게임 관련 상표, 이미지, 데이터 등의 지적재산권은
          주식회사 넥슨에 귀속되며, 서비스는 넥슨 Open API 이용약관에 따라
          해당 데이터를 활용합니다.
        </li>
        <li>
          회원은 서비스를 통해 얻은 정보를 운영자의 사전 승인 없이 상업적
          목적으로 사용하거나 제3자에게 제공할 수 없습니다.
        </li>
      </ul>

      {/* 제8조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제8조 (면책 조항)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          운영자는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적
          사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
        </li>
        <li>
          운영자는 회원이 서비스에 게시한 정보(신고 내용, 증거 자료, 댓글
          등)의 정확성, 신뢰성에 대해 보증하지 않으며, 이로 인해 발생하는
          손해에 대해 책임을 지지 않습니다.
        </li>
        <li>
          서비스의 투표 시스템은 커뮤니티 의견을 종합한 것으로, 투표 결과가
          실제 핵 사용 여부를 법적으로 증명하지 않습니다. 투표 결과로 인한
          분쟁에 대해 운영자는 책임을 지지 않습니다.
        </li>
        <li>
          운영자는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한
          분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지
          않습니다.
        </li>
        <li>
          넥슨 Open API의 데이터 오류, 지연, 서비스 중단 등으로 인한 서비스
          기능 제한에 대해 운영자는 책임을 지지 않습니다.
        </li>
        <li>
          무료로 제공되는 서비스에 대해 운영자는 관련 법령에서 정하는 범위를
          제외하고 어떠한 손해에 대해서도 책임을 지지 않습니다.
        </li>
      </ul>

      {/* 제9조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제9조 (이용 제한 및 계약 해지)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          운영자는 회원이 본 약관 또는 운영 정책을 위반한 경우, 운영 정책에
          따라 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.
        </li>
        <li>
          회원은 언제든지 서비스 내 설정을 통해 탈퇴를 요청할 수 있으며,
          운영자는 지체 없이 이를 처리합니다.
        </li>
        <li>
          회원 탈퇴 시 개인정보는 개인정보처리방침에 따라 처리되며, 회원이
          작성한 신고 및 투표 기록은 서비스의 공익적 목적을 위해 익명화되어
          보존될 수 있습니다.
        </li>
      </ul>

      {/* 제10조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제10조 (손해배상)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          회원이 본 약관을 위반하여 운영자에게 손해를 발생시킨 경우, 해당
          회원은 운영자에게 발생한 손해를 배상할 책임이 있습니다.
        </li>
        <li>
          회원이 서비스를 이용하면서 불법 행위 또는 본 약관 위반 행위로 인해
          제3자로부터 운영자가 손해배상 청구 등 각종 이의 제기를 받은 경우,
          해당 회원은 자신의 책임과 비용으로 운영자를 면책시켜야 합니다.
        </li>
      </ul>

      {/* 제11조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제11조 (분쟁 해결)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          본 약관과 관련하여 운영자와 회원 간에 발생한 분쟁에 대해서는
          대한민국 법률을 적용합니다.
        </li>
        <li>
          서비스 이용과 관련하여 발생한 분쟁은 먼저 운영자와 회원 간의 협의를
          통해 해결하도록 노력합니다.
        </li>
        <li>
          협의가 이루어지지 않을 경우 「민사소송법」에 따른 관할 법원에 소를
          제기할 수 있습니다.
        </li>
        <li>
          서비스 이용과 관련한 분쟁에 대해 한국인터넷진흥원(KISA)의
          개인정보침해신고센터 또는 한국소비자원에 조정을 신청할 수 있습니다.
        </li>
      </ul>

      {/* 제12조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제12조 (기타)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          본 약관에서 정하지 않은 사항은 관련 법령 및 상관례에 따릅니다.
        </li>
        <li>
          본 약관의 일부 조항이 무효가 되더라도 나머지 조항은 유효하게
          존속합니다.
        </li>
        <li>
          서비스는 넥슨이 공식적으로 운영하거나 보증하는 서비스가 아니며,
          넥슨 Open API 이용약관에 따라 공개 데이터를 활용하는 독립적인 커뮤니티
          서비스입니다.
        </li>
      </ul>

      <div className="mt-10 pt-6 border-t border-toss-gray-200 dark:border-toss-gray-800">
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
          본 이용약관에 대한 문의사항은 아래 연락처로 보내주시기 바랍니다.
        </p>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-2">
          이메일: salog.official@gmail.com
        </p>
      </div>
    </div>
  );
}

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-screen-md px-5 py-10">
      <h1 className="text-[22px] font-bold text-foreground mb-6">
        운영 정책
      </h1>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-2">
        시행일: 2026년 3월 19일
      </p>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        SALog(이하 &quot;서비스&quot;)는 서든어택 커뮤니티의 공정한 게임 환경을
        지향하며, 핵 사용자 추적 및 신고 시스템을 투명하고 책임감 있게
        운영하기 위해 다음과 같은 운영 정책을 수립합니다. 본 정책은 서비스를
        이용하는 모든 회원에게 적용됩니다.
      </p>

      {/* 제1조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제1조 (신고 가이드라인)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          신고는 반드시 병영주소 인증을 완료한 회원만 작성할 수 있습니다.
        </li>
        <li>
          신고 작성 시 대상 플레이어의 병영주소, 핵 사용 의심 근거(스크린샷,
          영상 링크, 전투 기록 등)를 포함해야 합니다.
        </li>
        <li>
          동일한 대상에 대한 중복 신고는 기존 신고에 추가 증거로 병합될 수
          있습니다.
        </li>
        <li>
          허위 신고, 감정적 비방, 개인정보 노출(실명, 연락처, 주소 등)이
          포함된 신고는 즉시 삭제되며, 작성자에게 제재가 부과될 수 있습니다.
        </li>
        <li>
          신고 내용은 사실에 기반해야 하며, 추측이나 소문만으로 작성된 신고는
          반려될 수 있습니다.
        </li>
        <li>
          신고 대상의 닉네임 변경 이력은 시스템이 6시간 간격으로 자동
          추적하며, 신고 기록에 반영됩니다.
        </li>
      </ul>

      {/* 제2조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제2조 (투표 시스템 및 판정 기준)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-3">
        SALog는 커뮤니티 기반의 3단계 투표 시스템을 통해 핵 사용 여부를
        판정합니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          <strong>1단계 - 의심 (Suspect):</strong> 신고가 접수되면 해당
          플레이어는 &quot;의심&quot; 상태로 등록됩니다. 이 단계에서는 커뮤니티
          회원들이 증거를 검토하고 의견을 남길 수 있습니다.
        </li>
        <li>
          <strong>2단계 - 유력 (Probable):</strong> 일정 수 이상의 동의
          투표가 누적되면 &quot;유력&quot; 단계로 승격됩니다. 이 단계에서는
          추가 증거 수집 및 심층 검토가 진행됩니다.
        </li>
        <li>
          <strong>3단계 - 확정 (Confirmed):</strong> 충분한 증거와 커뮤니티
          합의가 이루어지면 &quot;확정&quot; 상태로 전환됩니다. 확정된
          플레이어는 블랙리스트에 등재됩니다.
        </li>
        <li>
          투표는 병영주소 인증을 완료한 회원만 참여할 수 있으며, 1인 1표
          원칙이 적용됩니다.
        </li>
        <li>
          자기 자신에 대한 신고에는 투표할 수 없으며, 부정 투표(다중 계정
          활용 등)가 적발될 경우 해당 회원의 모든 투표가 무효 처리되고 계정이
          정지됩니다.
        </li>
        <li>
          판정 결과에 이의가 있는 경우, 운영진에게 재심을 요청할 수 있습니다.
          재심 요청 시 새로운 증거를 반드시 첨부해야 합니다.
        </li>
      </ul>

      {/* 제3조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제3조 (매너 신고)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          매너 신고는 핵 사용 외의 비매너 행위(욕설, 고의적 팀킬, 게임 방해
          등)를 기록하기 위한 기능입니다.
        </li>
        <li>
          매너 신고는 블랙리스트 등재와는 별개로 운영되며, 해당 플레이어의
          매너 점수에 반영됩니다.
        </li>
        <li>
          허위 매너 신고 역시 제재 대상이며, 반복적인 허위 신고 시 신고 기능
          이용이 제한됩니다.
        </li>
      </ul>

      {/* 제4조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제4조 (제재 정책)
      </h2>
      <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mb-3">
        서비스 운영 정책을 위반한 회원에게는 다음과 같은 제재가 부과됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          <strong>1차 위반 - 경고:</strong> 위반 사항을 통보하고 해당 콘텐츠를
          삭제합니다.
        </li>
        <li>
          <strong>2차 위반 - 기능 제한:</strong> 신고 작성, 투표, 댓글 등
          일부 기능의 이용이 7일간 제한됩니다.
        </li>
        <li>
          <strong>3차 위반 - 계정 정지:</strong> 30일간 서비스 이용이
          정지됩니다.
        </li>
        <li>
          <strong>중대 위반 - 영구 차단:</strong> 허위 신고 반복, 다중 계정
          악용, 타인 개인정보 유출, 서비스 운영 방해 등 중대한 위반 행위는
          즉시 영구 차단 조치됩니다.
        </li>
        <li>
          제재 이력은 내부적으로 기록되며, 제재에 대한 이의 신청은
          salog.official@gmail.com으로 접수할 수 있습니다.
        </li>
      </ul>

      {/* 제5조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제5조 (콘텐츠 책임)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          회원이 작성한 신고, 댓글, 증거 자료 등 모든 콘텐츠에 대한 법적
          책임은 작성자 본인에게 있습니다.
        </li>
        <li>
          타인의 명예를 훼손하거나 허위 사실을 유포하는 콘텐츠는 관련 법률에
          따라 민형사상 책임이 발생할 수 있습니다.
        </li>
        <li>
          서비스는 회원이 게시한 콘텐츠의 정확성, 신뢰성, 적법성을 보증하지
          않으며, 이로 인해 발생하는 분쟁에 대해 책임을 지지 않습니다.
        </li>
        <li>
          게임 내 스크린샷, 영상 등 증거 자료의 저작권은 해당 게임사(넥슨)에
          귀속될 수 있으며, 서비스 내에서의 사용은 공정 이용 범위 내에서
          허용됩니다.
        </li>
        <li>
          운영진은 부적절한 콘텐츠를 사전 통보 없이 삭제하거나 비공개
          처리할 수 있습니다.
        </li>
      </ul>

      {/* 제6조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제6조 (운영진 권한)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          운영진은 서비스의 원활한 운영을 위해 다음의 권한을 행사할 수
          있습니다.
        </li>
        <li>
          부적절한 신고, 댓글, 콘텐츠의 삭제 또는 비공개 전환
        </li>
        <li>
          운영 정책 위반 회원에 대한 경고, 기능 제한, 계정 정지, 영구 차단
        </li>
        <li>
          투표 결과의 검증 및 부정 투표 무효화
        </li>
        <li>
          블랙리스트 등재 및 해제에 대한 최종 결정
        </li>
        <li>
          서비스 안정성을 위한 긴급 조치(기능 일시 중단, 데이터 보정 등)
        </li>
        <li>
          운영진의 판단은 커뮤니티의 건전한 운영을 최우선으로 하며, 자의적
          권한 남용을 방지하기 위해 주요 결정 사항은 Discord를 통해
          공지됩니다.
        </li>
      </ul>

      {/* 제7조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제7조 (닉네임 추적 및 블랙리스트)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          서비스는 넥슨 Open API를 활용하여 등록된 플레이어의 닉네임 변경
          이력을 6시간 간격으로 자동 추적합니다.
        </li>
        <li>
          닉네임이 변경되더라도 병영주소를 기반으로 동일 플레이어를 식별하며,
          기존 신고 기록 및 블랙리스트 상태는 유지됩니다.
        </li>
        <li>
          블랙리스트에 등재된 플레이어의 정보(병영주소, 닉네임 변경 이력,
          신고 내역)는 모든 회원에게 공개됩니다.
        </li>
        <li>
          블랙리스트 해제는 충분한 소명과 운영진의 심사를 거쳐 결정됩니다.
        </li>
      </ul>

      {/* 제8조 */}
      <h2 className="text-[16px] font-semibold text-foreground mt-8 mb-3">
        제8조 (정책 변경)
      </h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
        <li>
          본 운영 정책은 서비스 운영 상황에 따라 변경될 수 있으며, 변경 시
          서비스 내 공지 및 Discord를 통해 사전에 안내합니다.
        </li>
        <li>
          정책 변경 후에도 서비스를 계속 이용하는 경우 변경된 정책에
          동의한 것으로 간주합니다.
        </li>
      </ul>

      <div className="mt-10 pt-6 border-t border-toss-gray-200 dark:border-toss-gray-800">
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
          본 운영 정책에 대한 문의사항은 아래 연락처로 보내주시기 바랍니다.
        </p>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed mt-2">
          이메일: salog.official@gmail.com
        </p>
      </div>
    </div>
  );
}

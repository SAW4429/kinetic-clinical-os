// ============================================================
//  DeleteConfirmModal — "삭제" 직접 타이핑 확인 모달
// ============================================================

import { useState } from 'react';
import type { Language } from '../../data/clinicalDB';

const CONFIRM_WORD: Record<Language, string> = { ko:'삭제', ja:'削除', en:'DELETE' };

const T = {
  ko:{ title:'정말 삭제하시겠습니까?', warning:'삭제된 데이터는 복구할 수 없습니다.', instruction:(w:string)=>`확인을 위해 "${w}" 라고 정확히 입력해주세요.`, placeholder:'삭제', confirm:'영구 삭제', cancel:'취소' },
  ja:{ title:'本当に削除しますか？', warning:'削除されたデータは復元できません。', instruction:(w:string)=>`確認のため「${w}」と正確に入力してください。`, placeholder:'削除', confirm:'完全削除', cancel:'キャンセル' },
  en:{ title:'Are you sure you want to delete?', warning:'This action is irreversible. Deleted data cannot be recovered.', instruction:(w:string)=>`Type "${w}" to confirm.`, placeholder:'DELETE', confirm:'Permanently Delete', cancel:'Cancel' },
};

interface Props {
  lang:       Language;
  itemLabel?: string;   // 무엇을 삭제하는지 (예: "홍길동 환자")
  onConfirm:  () => void;
  onClose:    () => void;
}

export function DeleteConfirmModal({ lang, itemLabel, onConfirm, onClose }: Props) {
  const t    = T[lang];
  const word = CONFIRM_WORD[lang];
  const [typed, setTyped] = useState('');
  const isValid = typed === word;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-red-500 dark:border-red-700 bg-white dark:bg-slate-900 p-7 shadow-2xl">
        {/* 경고 아이콘 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
            {itemLabel && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{itemLabel}</p>}
          </div>
        </div>

        {/* 경고 메시지 */}
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t.warning}</p>
        </div>

        {/* 타이핑 확인 */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{t.instruction(word)}</p>
        <input
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={t.placeholder}
          className={`w-full rounded-xl border-2 px-4 py-3 font-mono text-sm font-bold tracking-wider focus:outline-none transition-colors ${
            isValid
              ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-red-400'
          }`}
          autoFocus
        />

        {/* 버튼 */}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!isValid}
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

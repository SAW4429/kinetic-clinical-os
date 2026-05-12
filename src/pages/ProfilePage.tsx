// ============================================================
//  ProfilePage — 마이 프로필 + 환자 목록(차트 연동) + 휴지통 대시보드
// ============================================================

import { useState, useRef } from 'react';
import { Trash2, RotateCcw, X, FolderOpen } from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useUserAuth } from '../context/UserAuthContext';
import { useCharts, type ChartRecord } from '../context/ChartContext';
import { usePatient }  from '../context/PatientContext';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { RecordList } from '../components/profile/RecordList';
import { formatPhone } from '../lib/validators';
import type { Language } from '../data/clinicalDB';

// ── ChartCard ─────────────────────────────────────────────────

function ChartCard({ chart, lang }: { chart:ChartRecord; lang:Language }) {
  const TYPE: Record<string,Record<Language,string>> = {'initial':{ko:'초진',ja:'初診',en:'Initial'},'follow-up':{ko:'재진',ja:'再診',en:'Follow-up'},'discharge':{ko:'퇴원',ja:'退院',en:'Discharge'}};
  const isDraft=chart.status==='draft';
  return (
    <div className="chart-card rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{chart.chiefComplaint||(lang==='ko'?'주호소 없음':'No CC')}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${isDraft?'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400':'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'}`}>
            {isDraft?(lang==='ko'?'초안':lang==='ja'?'下書き':'Draft'):(lang==='ko'?'완료':lang==='ja'?'完了':'Done')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{chart.date}</span><span>·</span>
          <span>{TYPE[chart.type]?.[lang]??chart.type}</span>
          {chart.vasRest!==undefined&&<><span>·</span><span>VAS {chart.vasRest}/10</span></>}
        </div>
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-600 shrink-0 text-right">v{chart.version}</div>
    </div>
  );
}

// ── RecycleBinSection ─────────────────────────────────────────

function RecycleBinSection({ lang }: { lang:Language }) {
  const { myRecycleBin, daysLeft, restoreItem, permanentDelete } = usePatient();
  const [confirmId, setConfirmId] = useState<string|null>(null);

  const L={ko:{title:'휴지통',sub:'15일 후 자동 영구 삭제됩니다.',empty:'휴지통이 비어있습니다.',restore:'복원',del:'영구 삭제',days:(n:number)=>`${n}일 남음`,patient:'환자',chart:'차트'},ja:{title:'ゴミ箱',sub:'15日後に自動的に完全削除されます。',empty:'ゴミ箱は空です。',restore:'復元',del:'完全削除',days:(n:number)=>`残${n}日`,patient:'患者',chart:'チャート'},en:{title:'Trash',sub:'Items are permanently deleted after 15 days.',empty:'Trash is empty.',restore:'Restore',del:'Delete Forever',days:(n:number)=>`${n}d left`,patient:'Patient',chart:'Chart'}}[lang];

  const item=confirmId?myRecycleBin.find(i=>i.id===confirmId):null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Trash2 size={16} className="text-slate-500"/>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{L.title}</h3>
        {myRecycleBin.length>0&&<span className="rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-bold px-2 py-0.5">{myRecycleBin.length}</span>}
        <span className="text-xs text-slate-400 dark:text-slate-500">{L.sub}</span>
      </div>

      {myRecycleBin.length===0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center bg-white dark:bg-slate-900">
          <p className="text-slate-400 dark:text-slate-500 text-sm">{L.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {myRecycleBin.map(item=>{
            const left=daysLeft(item);
            const urgent=left<=3;
            return (
              <div key={item.id} className={`flex items-center gap-4 rounded-xl border p-4 ${urgent?'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20':'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.type==='patient'?'bg-sky-100 dark:bg-sky-950/40':'bg-violet-100 dark:bg-violet-950/40'}`}>
                  <span className="text-sm">{item.type==='patient'?'👤':'📋'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.type==='patient'?L.patient:L.chart} · {new Date(item.deletedAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${urgent?'text-red-600 dark:text-red-400':'text-slate-400 dark:text-slate-500'}`}>
                  {L.days(left)}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={()=>restoreItem(item.id)} title={L.restore} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"><RotateCcw size={14}/></button>
                  <button onClick={()=>setConfirmId(item.id)} title={L.del} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"><X size={14}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmId&&item&&(
        <DeleteConfirmModal lang={lang} itemLabel={item.displayName}
          onClose={()=>setConfirmId(null)}
          onConfirm={()=>{ permanentDelete(confirmId); setConfirmId(null); }}/>
      )}
    </section>
  );
}

// ── ProfileDashboard ──────────────────────────────────────────

interface ProfileDashboardProps { lang:Language; onShowEdit:()=>void; onOpenChart:(id:string)=>void; }

function ProfileDashboard({ lang, onShowEdit, onOpenChart }: ProfileDashboardProps) {
  const { user } = useAuth();
  const { charts } = useCharts();
  const { myPatients, getPatientSessions, markViewed } = usePatient();

  // 전체 차트 원본에서 본인 소유만 필터 (authorId 패턴)
  const myCharts:ChartRecord[] = Object.values(charts).filter(c=>c.ownerId===user?.id).sort((a,b)=>b.updatedAt-a.updatedAt);

  const L={ko:{myCharts:'최근 내가 작성한 임상 자료',noCharts:'작성된 차트가 없습니다.',myPt:'나의 환자 목록',noPt:'등록된 환자가 없습니다.',openChart:'차트 열람',sessions:'세션',lastVisit:'최근 방문',expert:'전문가 코드',none:'미인증',edit:'정보 수정',changeAvatar:'사진 변경',role:'직업'},ja:{myCharts:'最近作成した臨床資料',noCharts:'チャートがありません。',myPt:'担当患者リスト',noPt:'患者がいません。',openChart:'チャート閲覧',sessions:'セッション',lastVisit:'最終来院',expert:'専門家コード',none:'未認証',edit:'情報編集',changeAvatar:'写真変更',role:'職業'},en:{myCharts:'My Recent Clinical Records',noCharts:'No charts yet.',myPt:'My Patients',noPt:'No patients yet.',openChart:'View Charts',sessions:'Sessions',lastVisit:'Last Visit',expert:'Expert Code',none:'None',edit:'Edit Info',changeAvatar:'Change Photo',role:'Role'}}[lang];

  const { isExpert, expertTier } = useAuth();

  if(!user) return null;
  return (
    <div className="flex flex-col gap-7">
      {/* UserInfo */}
      <div className="chart-card rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-start gap-5">
        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-sky-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {user.avatarBase64 ? <img src={user.avatarBase64} alt="avatar" className="h-full w-full object-cover"/> : <span className="text-2xl font-bold text-slate-400">{user.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{user.name}</h3><p className="text-sm text-slate-500">@{user.userId}</p></div>
            <button onClick={onShowEdit} className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">{L.edit}</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400">{L.role}: {user.role}</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${isExpert?'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400':'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
              {L.expert}: {isExpert?expertTier:L.none}
            </span>
          </div>
        </div>
      </div>

      {/* 나의 환자 목록 (차트 열람 버튼 포함) */}
      <section>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">👤 {L.myPt} <span className="text-xs text-slate-400 font-normal">(Private)</span></h3>
        {myPatients.length===0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center bg-white dark:bg-slate-900">
            <p className="text-slate-400 dark:text-slate-500 text-sm">{L.noPt}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {myPatients.map(p=>{
              const sessions=getPatientSessions(p.id);
              const last=sessions[0];
              return (
                <div key={p.id} className="chart-card rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.condition}</p>
                  </div>
                  <div className="text-xs text-slate-400 text-right shrink-0">
                    <div>{L.sessions}: {sessions.length}</div>
                    {last&&<div>{L.lastVisit}: {last.date}</div>}
                  </div>
                  {/* 프로필에서도 차트 열람 가능 */}
                  <button onClick={()=>{ markViewed(p.id); onOpenChart(p.id); }} title={L.openChart} className="shrink-0 p-2 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all">
                    <FolderOpen size={15}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 최근 작성한 임상 자료 */}
      <section>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          📋 {L.myCharts}<span className="rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 text-xs font-bold px-2 py-0.5">{myCharts.length}</span>
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {myCharts.map(c=><ChartCard key={c.id} chart={c} lang={lang}/>)}
          {myCharts.length===0&&(
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center bg-white dark:bg-slate-900">
              <p className="text-slate-400 dark:text-slate-500 text-sm">{L.noCharts}</p>
            </div>
          )}
        </div>
      </section>

      {/* 전체 임상 기록 (소프트 삭제) */}
      <RecordList lang={lang}/>

      {/* 휴지통 대시보드 */}
      <RecycleBinSection lang={lang}/>
    </div>
  );
}

// ── EditPanel ─────────────────────────────────────────────────

interface EditPanelProps { lang:Language; onBack:()=>void; onDeleted:()=>void; }

function EditPanel({ lang, onBack, onDeleted }: EditPanelProps) {
  const { user, updateProfile, updatePassword, deleteAccount }=useAuth();
  const [name,setName]=useState(user?.name??'');const [phone,setPhone]=useState(user?.phone??'');const [email,setEmail]=useState(user?.email??'');const [school,setSchool]=useState(user?.school??'');const [org,setOrg]=useState(user?.organization??'');const [avatar,setAvatar]=useState(user?.avatarBase64??'');
  const [saved,setSaved]=useState(false);const [oldPw,setOldPw]=useState('');const [newPw,setNewPw]=useState('');const [cnfPw,setCnfPw]=useState('');const [pwMsg,setPwMsg]=useState('');const [showDel,setShowDel]=useState(false);
  const avatarRef=useRef<HTMLInputElement>(null);
  if(!user) return null;
  const L={ko:{back:'← 프로필로',save:'저장',saved:'저장됨',changePw:'비밀번호 변경',pwOk:'변경완료',pwErr:'현재 비밀번호 오류',pwMis:'불일치',del:'계정 삭제',delDesc:'삭제 시 모든 데이터 영구 삭제.',changeAvatar:'사진 변경'},ja:{back:'← プロフィールへ',save:'保存',saved:'保存済み',changePw:'PW変更',pwOk:'変更完了',pwErr:'現在PW誤り',pwMis:'不一致',del:'アカウント削除',delDesc:'削除時すべてのデータが永久削除。',changeAvatar:'写真変更'},en:{back:'← Back',save:'Save',saved:'Saved!',changePw:'Change PW',pwOk:'Changed!',pwErr:'Wrong PW',pwMis:'Mismatch',del:'Delete Account',delDesc:'All data permanently deleted.',changeAvatar:'Change Photo'}}[lang];
  const inp="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-400 focus:outline-none w-full";
  const save=()=>{ updateProfile({name:name.trim(),phone:phone.trim(),email:email.trim(),school:school.trim(),organization:org.trim(),avatarBase64:avatar||undefined}); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const changePw=()=>{ setPwMsg(''); if(newPw!==cnfPw)return setPwMsg(L.pwMis); const r=updatePassword(oldPw,newPw); setPwMsg(r==='WRONG_PASSWORD'?L.pwErr:L.pwOk); if(!r){setOldPw('');setNewPw('');setCnfPw('');} };
  const handleAvatar=(e:React.ChangeEvent<HTMLInputElement>)=>{ const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=ev=>setAvatar(ev.target?.result as string);reader.readAsDataURL(f); };
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 self-start">{L.back}</button>
      <div className="flex items-center gap-4"><div className="h-16 w-16 rounded-full overflow-hidden border-2 border-sky-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer" onClick={()=>avatarRef.current?.click()}>{avatar?<img src={avatar} alt="" className="h-full w-full object-cover"/>:<span className="text-2xl font-bold text-slate-400">{user.name?.[0]?.toUpperCase()}</span>}</div><button onClick={()=>avatarRef.current?.click()} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">{L.changeAvatar}</button><input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden"/></div>
      <div className="chart-card rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([['이름','Name','氏名',name,setName],['전화번호','Phone','電話番号',phone,(v:string)=>setPhone(formatPhone(v))],['이메일','Email','メール',email,setEmail],['학교','School','学校',school,setSchool]] as const).map(([ko,en,ja,v,sv],i)=>(
            <div key={i} className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?ko:lang==='ja'?ja:en}</label><input value={v} onChange={e=>(sv as(v:string)=>void)(e.target.value)} className={inp}/></div>
          ))}
          <div className="flex flex-col gap-1.5 sm:col-span-2"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lang==='ko'?'기관':lang==='ja'?'機関':'Org'}</label><input value={org} onChange={e=>setOrg(e.target.value)} className={inp}/></div>
        </div>
        <button onClick={save} className="self-end rounded-xl bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-sm font-bold text-white">{saved?`✓ ${L.saved}`:L.save}</button>
      </div>
      <div className="chart-card rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col gap-3">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{L.changePw}</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([[lang==='ko'?'현재 PW':'Current PW',oldPw,setOldPw],[lang==='ko'?'새 PW':'New PW',newPw,setNewPw],[lang==='ko'?'확인':'Confirm',cnfPw,setCnfPw]] as const).map(([lb,v,sv],i)=>(
            <div key={i} className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lb}</label><input type="password" value={v} onChange={e=>(sv as(v:string)=>void)(e.target.value)} className={inp}/></div>
          ))}
        </div>
        {pwMsg&&<p className={`text-xs ${pwMsg===L.pwOk?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'}`}>{pwMsg}</p>}
        <button onClick={changePw} className="self-end rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{L.changePw}</button>
      </div>
      <div className="rounded-2xl border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-5">
        <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">⚠ {L.del}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{L.delDesc}</p>
        <button onClick={()=>setShowDel(true)} className="rounded-xl border border-red-400 dark:border-red-700 bg-white dark:bg-red-950/40 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50">{L.del}</button>
      </div>
      {showDel&&<DeleteConfirmModal lang={lang} itemLabel={`${user.name} (${user.userId})`} onClose={()=>setShowDel(false)} onConfirm={()=>{deleteAccount();onDeleted();}}/>}
    </div>
  );
}

// ── 메인 ProfilePage ──────────────────────────────────────────

interface Props { lang:Language; onBack:()=>void; onDeleted:()=>void; onOpenChart:(id:string)=>void; }

export function ProfilePage({ lang, onBack, onDeleted, onOpenChart }: Props) {
  const [editMode,setEditMode]=useState(false);
  return (
    <div className="p-4 md:p-6 min-h-full" style={{background:'var(--bg-app)'}}>
      <div className="content-wrap max-w-3xl mx-auto flex flex-col gap-6">
        {!editMode&&(
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">{lang==='ko'?'← 대시보드':lang==='ja'?'← ダッシュボード':'← Dashboard'}</button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{lang==='ko'?'내 프로필':lang==='ja'?'マイページ':'My Profile'}</h2>
            <div/>
          </div>
        )}
        {editMode
          ? <EditPanel lang={lang} onBack={()=>setEditMode(false)} onDeleted={onDeleted}/>
          : <ProfileDashboard lang={lang} onShowEdit={()=>setEditMode(true)} onOpenChart={onOpenChart}/>
        }
      </div>
    </div>
  );
}

export default ProfilePage;

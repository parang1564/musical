import { useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Gloomy from './lee/glo/gloomy.jsx';       
import Anarchist from './lee/ana/anarchist.jsx'; 
import Western from './park/western/western.jsx';    
import Othello from "./park/oi/othelloIago.jsx"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainDirectory />} />
      <Route path="/lee/glo" element={<Gloomy />} />
      <Route path="/lee/ana" element={<Anarchist />} /> 
      <Route path="/park/western" element={<Western />} />
      <Route path="/park/oi" element={<Othello />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MainDirectory() {
  const navigate = useNavigate();
  const location = useLocation();

  // 💡 [핵심 해결책] 
  // HashRouter를 썼음에도 주소 인식 문제로 홈에 갇히는 경우를 방지하기 위해,
  // 만약 브라우저 주소창에 해시(#) 뒤에 경로가 있는데 홈(MainDirectory)이 떴다면 강제로 그 경로로 꽂아줍니다.
  useEffect(() => {
    const hash = window.location.hash; // 예: #/lee/ana
    if (hash && hash.length > 2) {
      const realPath = hash.replace('#', ''); // /lee/ana 추출
      if (realPath !== '/') {
        navigate(realPath, { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 text-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">뮤지컬 정산 스케줄러</h1>
        <p className="text-xs font-medium text-slate-400 mt-1.5 mb-8">원하는 스케줄러를 선택하세요.</p>

        <div className="flex flex-col gap-3">
          <Link 
            to="/lee/ana"
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-between px-6"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-white text-base font-bold">🚩 아나키스트</span>
              <span className="text-[11px] text-teal-100 font-normal mt-0.5">이진혁 회차 정산</span>
            </div>
            <span className="text-xl">➔</span>
          </Link>

          <Link 
            to="/lee/glo"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-between px-6"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-white text-base font-bold">🚢 사의찬미</span>
              <span className="text-[11px] text-purple-200 font-normal mt-0.5">이진혁 회차 정산</span>
            </div>
            <span className="text-xl">➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Gloomy from './lee/glo/gloomy.jsx';       // 사의찬미
import Anarchist from './lee/ana/anarchist.jsx'; // 아나키스트
import Western from './park/western/western.jsx';    // 웨스턴스토리
import Othello from "./park/oi/othelloIago.jsx"; // 오셀로와이아고

export default function App() {
  return (
    <Routes>
      {/* 🏠 기본 홈 */}
      <Route path="/" element={<MainDirectory />} />

      {/* 🚀 이진혁 배우 작품들 */}
      <Route path="/lee/glo" element={<Gloomy />} />
      <Route path="/lee/ana" element={<Anarchist />} /> 
      
      {/* 🚀 박규원 배우 작품 */}
      <Route path="/park/western" element={<Western />} />
      <Route path="/park/oi" element={<Othello />} />

      {/* ⚠️ 그 외 경로는 메인으로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MainDirectory() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 text-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">뮤지컬 정산 스케줄러</h1>
        <p className="text-xs font-medium text-slate-400 mt-1.5 mb-8">원하는 스케줄러를 선택하세요.</p>

        <div className="flex flex-col gap-3">
          {/* 아나키스트 바로가기 버튼 */}
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

          {/* 사의찬미 바로가기 버튼 (수정: to="/lee" -> to="/lee/glo") */}
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
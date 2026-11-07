import { useState, useEffect, useRef, useMemo } from 'react';
import { openDB } from 'idb';
import html2canvas from 'html2canvas';
import './underMoonbow.css';

// 🔗 외부 링크 설정
const POSTER_LINK = "https://x.com/gleam__company/status/2115594464232104054?a=50FgLacZXNkg6ZarrcE&s=20";
const SEATING_CHART_LINK = "https://x.com/gleam__company/status/2117436603526467591?a=8Oflw5W3vGOOpgZRqzg&s=20";
const FIRST_TICKET_LINK = "https://x.com/gleam__company/status/2118282231991136549?a=0JhG_EzuWa5xIHckFXo&s=20";
const PROFILE_LINK = "https://x.com/gleam__company/status/2117444493121347998?a=7yR65w_8OlNR08wqIrM&s=20";

// 🎟️ 티켓 정가 및 할인 옵션 데이터 (조기예매 25% 최상단)
const TICKET_ORIGIN_PRICE = 77000;

const DISCOUNT_OPTIONS = {
  "조기예매 25%": { rate: 0.25, label: "조기예매 25%" },
  "재관람할인 25%": { rate: 0.25, label: "재관람할인 25%" },
  "프리뷰할인 30%": { rate: 0.3, label: "프리뷰할인 30%" },
  "마티네할인 30%": { rate: 0.3, label: "마티네할인 30%" },
  "40% 할인권": { rate: 0.4, label: "40% 할인권" },
  "국가유공자/유공할인 50%": { rate: 0.5, label: "국가유공자/유공할인 50%" }
};

const calcDiscountPriceNumber = (discountKey, fee = 2000) => {
  const option = DISCOUNT_OPTIONS[discountKey] || DISCOUNT_OPTIONS["조기예매 25%"];
  return TICKET_ORIGIN_PRICE * (1 - option.rate) + fee;
};

const calcDiscountPrice = (discountKey, fee = 2000) => {
  const finalPrice = calcDiscountPriceNumber(discountKey, fee);
  return `${Math.max(0, finalPrice).toLocaleString()}원`;
};

// 👥 출연진 문자열 헬퍼
const getCleanCastString = (item) => {
  if (!item) return "";
  return [
    item.choinha,
    item.gilmohyun,
    item.baekgyeonggam,
    item.ichanghwan,
    item.chorusM,
    item.chorusF
  ].filter(Boolean).join(" ");
};

const getTimeOfDay = (timeStr) => {
  if (!timeStr) return "";
  const hour = parseInt(timeStr.split(":")[0], 10);
  return hour < 17 ? "낮" : "밤";
};

const formatTimeSimple = (timeStr) => {
  if (!timeStr) return "";
  const hour = parseInt(timeStr.split(":")[0], 10);
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}시`;
};

// 📅 뮤지컬 언더 문보우 1차 스케줄 데이터 (12.12 ~ 1.03)
const defaultInitialData = [
  { id: 1, month: 12, date: "12.12", day: "토", time: "14:00", choinha: "차서원", gilmohyun: "이진혁", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 2, month: 12, date: "12.12", day: "토", time: "18:00", choinha: "윤지성", gilmohyun: "이시강", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 3, month: 12, date: "12.13", day: "일", time: "14:00", choinha: "차서원", gilmohyun: "김우진", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 4, month: 12, date: "12.13", day: "일", time: "18:00", choinha: "김우석", gilmohyun: "강찬", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 5, month: 12, date: "12.15", day: "화", time: "20:00", choinha: "윤지성", gilmohyun: "김우진", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 6, month: 12, date: "12.16", day: "수", time: "16:00", choinha: "김우석", gilmohyun: "이시강", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 7, month: 12, date: "12.16", day: "수", time: "20:00", choinha: "차서원", gilmohyun: "강찬", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 8, month: 12, date: "12.17", day: "목", time: "20:00", choinha: "이주순", gilmohyun: "이진혁", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 9, month: 12, date: "12.18", day: "금", time: "20:00", choinha: "김우석", gilmohyun: "이시강", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 10, month: 12, date: "12.19", day: "토", time: "14:00", choinha: "윤지성", gilmohyun: "강찬", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 11, month: 12, date: "12.19", day: "토", time: "18:00", choinha: "김우석", gilmohyun: "김우진", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 12, month: 12, date: "12.20", day: "일", time: "14:00", choinha: "차서원", gilmohyun: "김우진", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 13, month: 12, date: "12.20", day: "일", time: "18:00", choinha: "이주순", gilmohyun: "이진혁", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 14, month: 12, date: "12.22", day: "화", time: "20:00", choinha: "윤지성", gilmohyun: "강찬", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 15, month: 12, date: "12.23", day: "수", time: "16:00", choinha: "차서원", gilmohyun: "김우진", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 16, month: 12, date: "12.23", day: "수", time: "20:00", choinha: "윤지성", gilmohyun: "이진혁", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 17, month: 12, date: "12.24", day: "목", time: "20:00", choinha: "김우석", gilmohyun: "이진혁", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 18, month: 12, date: "12.25", day: "금", time: "14:00", choinha: "이주순", gilmohyun: "김우진", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 19, month: 12, date: "12.25", day: "금", time: "18:00", choinha: "차서원", gilmohyun: "이시강", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 20, month: 12, date: "12.26", day: "토", time: "14:00", choinha: "김우석", gilmohyun: "김우진", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 21, month: 12, date: "12.26", day: "토", time: "18:00", choinha: "차서원", gilmohyun: "강찬", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 22, month: 12, date: "12.27", day: "일", time: "14:00", choinha: "김우석", gilmohyun: "이진혁", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 23, month: 12, date: "12.27", day: "일", time: "18:00", choinha: "윤지성", gilmohyun: "이시강", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "서예준", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 24, month: 12, date: "12.29", day: "화", time: "20:00", choinha: "차서원", gilmohyun: "강찬", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 25, month: 12, date: "12.30", day: "수", time: "16:00", choinha: "이주순", gilmohyun: "김우진", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 26, month: 12, date: "12.30", day: "수", time: "20:00", choinha: "김우석", gilmohyun: "이진혁", baekgyeonggam: "홍륜희", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 27, month: 12, date: "12.31", day: "목", time: "20:00", choinha: "차서원", gilmohyun: "김우진", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 28, month: 1, date: "1.01", day: "금", time: "14:00", choinha: "윤지성", gilmohyun: "이진혁", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 29, month: 1, date: "1.01", day: "금", time: "18:00", choinha: "차서원", gilmohyun: "강찬", baekgyeonggam: "안유진", ichanghwan: "김태오", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 30, month: 1, date: "1.02", day: "토", time: "14:00", choinha: "김우석", gilmohyun: "김우진", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 31, month: 1, date: "1.02", day: "토", time: "18:00", choinha: "차서원", gilmohyun: "이시강", baekgyeonggam: "홍륜희", ichanghwan: "김태오", chorusM: "서예준", chorusF: "유지윤", seat: "", cardTarget: 1 },
  { id: 32, month: 1, date: "1.03", day: "일", time: "14:00", choinha: "이주순", gilmohyun: "김우진", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 },
  { id: 33, month: 1, date: "1.03", day: "일", time: "18:00", choinha: "윤지성", gilmohyun: "이진혁", baekgyeonggam: "안유진", ichanghwan: "조현우", chorusM: "김병영", chorusF: "박혜원", seat: "", cardTarget: 1 }
];

// 🪑 NOL 서경스퀘어스콘 2관 공식 좌석 배치도 데이터
const moonbowSeatPlan = {
  A: {
    2:  [{ num: 1, grade: 'HOLD' }, { num: 2, grade: 'HOLD' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    3:  [{ num: 1, grade: 'HOLD' }, { num: 2, grade: 'HOLD' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    4:  [{ num: 1, grade: 'HOLD' }, { num: 2, grade: 'HOLD' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    5:  [{ num: 1, grade: 'HOLD' }, { num: 2, grade: 'HOLD' }, { num: 3, grade: 'S', tl: true }, { num: 4, grade: 'S', tl: true }],
    6:  [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    7:  [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    8:  [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    9:  [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    10: [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    11: [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    12: [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }],
    13: [{ num: 1, grade: 'HOLD' }, { num: 2, grade: 'HOLD' }, { num: 3, grade: 'HOLD' }, { num: 4, grade: 'HOLD' }]
  },
  B: {
    0:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'S', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'S', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'S', tl: true },
      { num: 7, grade: 'R' }, { num: 8, grade: 'S' }, { num: 9, grade: 'R' }, { num: 10, grade: 'S' }, { num: 11, grade: 'R' }, { num: 12, grade: 'S' }
    ],
    1:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'R', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'R', tl: true }, { num: 7, grade: 'R', tl: true },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    2:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'S', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'HOLD', tl: true }, { num: 5, grade: 'S', tl: true }, { num: 6, grade: 'HOLD', tl: true }, { num: 7, grade: 'HOLD', tl: true },
      { num: 8, grade: 'S' }, { num: 9, grade: 'HOLD' }, { num: 10, grade: 'S' }, { num: 11, grade: 'HOLD' }, { num: 12, grade: 'S' }, { num: 13, grade: 'R' }
    ],
    3:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'R', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'R', tl: true }, { num: 7, grade: 'R', tl: true },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    4:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'R', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'R', tl: true }, { num: 7, grade: 'R', tl: true },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    5:  [
      { num: 1, grade: 'S', tl: true }, { num: 2, grade: 'S', tl: true }, { num: 3, grade: 'S', tl: true }, { num: 4, grade: 'S', tl: true }, { num: 5, grade: 'S', tl: true }, { num: 6, grade: 'S', tl: true }, { num: 7, grade: 'S', tl: true },
      { num: 8, grade: 'S' }, { num: 9, grade: 'S' }, { num: 10, grade: 'S' }, { num: 11, grade: 'S' }, { num: 12, grade: 'S' }, { num: 13, grade: 'S' }
    ],
    6:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'R', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'R', tl: true }, { num: 7, grade: 'R', tl: true },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    7:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'R', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'R', tl: true }, { num: 7, grade: 'R', tl: true },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    8:  [
      { num: 1, grade: 'R', tl: true }, { num: 2, grade: 'R', tl: true }, { num: 3, grade: 'R', tl: true }, { num: 4, grade: 'R', tl: true }, { num: 5, grade: 'R', tl: true }, { num: 6, grade: 'R', tl: true }, { num: 7, grade: 'R', tl: true },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    9:  [
      { num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'R' }, { num: 4, grade: 'R' }, { num: 5, grade: 'R' }, { num: 6, grade: 'R' }, { num: 7, grade: 'R' },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    10: [
      { num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'R' }, { num: 4, grade: 'R' }, { num: 5, grade: 'R' }, { num: 6, grade: 'R' }, { num: 7, grade: 'R' },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    11: [
      { num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'R' }, { num: 4, grade: 'R' }, { num: 5, grade: 'R' }, { num: 6, grade: 'R' }, { num: 7, grade: 'R' },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ],
    12: [
      { num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'R' }, { num: 4, grade: 'R' }, { num: 5, grade: 'R' }, { num: 6, grade: 'R' }, { num: 7, grade: 'R' },
      { num: 8, grade: 'R' }, { num: 9, grade: 'R' }, { num: 10, grade: 'R' }, { num: 11, grade: 'R' }, { num: 12, grade: 'R' }, { num: 13, grade: 'R' }
    ]
  },
  C: {
    2:  [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'HOLD' }, { num: 4, grade: 'HOLD' }],
    3:  [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'HOLD' }, { num: 4, grade: 'HOLD' }],
    4:  [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'HOLD' }, { num: 4, grade: 'HOLD' }],
    5:  [{ num: 1, grade: 'S' }, { num: 2, grade: 'S' }, { num: 3, grade: 'HOLD' }, { num: 4, grade: 'HOLD' }],
    6:  [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    7:  [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    8:  [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    9:  [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    10: [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    11: [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    12: [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }],
    13: [{ num: 1, grade: 'R' }, { num: 2, grade: 'R' }, { num: 3, grade: 'S' }, { num: 4, grade: 'S' }]
  }
};

const DB_NAME = 'MusicalSchedulerDB_UnderMoonbow_NeonAlley_V7';
const STORE_NAME = 'schedules';
const SETTING_STORE = 'settings';
const DB_VERSION = 1;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTING_STORE)) {
        db.createObjectStore(SETTING_STORE, { keyPath: 'key' });
      }
    },
  });
};

export default function UnderMoonbow() {
  const [schedules, setSchedules] = useState([]);
  const fileInputRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [searchActor, setSearchActor] = useState('이진혁');

  const [cardBonuses, setCardBonuses] = useState({});
  const [extraCards, setExtraCards] = useState(0);
  const [cardCollapsedMap, setCardCollapsedMap] = useState({});
  const [monthCollapsedMap, setMonthCollapsedMap] = useState({});
  const [calendarCollapsedMap, setCalendarCollapsedMap] = useState({ 12: false, 1: false });

  // 📋 양도 모달 (기본 조기예매 25%)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [ticketFee, setTicketFee] = useState(2000);
  const [modalInputs, setModalInputs] = useState({
    musicalName: '뮤지컬 언더 문보우',
    transferSeat: '',
    discountType: '조기예매 25%',
    price: calcDiscountPrice('조기예매 25%', 2000),
    notice: '증빙 필요, 찾아드릴 수 없습니다',
    twitterTag: '@YeonMyuticket'
  });

  // 🔄 교환 모달
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeItem, setExchangeItem] = useState(null);
  const [selectedTargetScheduleId, setSelectedTargetScheduleId] = useState('');
  const [exchangeInputs, setExchangeInputs] = useState({
    musicalName: '뮤지컬 언더 문보우',
    myDateInfo: '',
    mySeat: '',
    targetDates: '',
    targetSeats: '',
    bottomNote: '맘찍 후 디엠 주세요'
  });

  const formatSeatInput = (val) => {
    if (!val) return '';
    const clean = val.toUpperCase().replace(/\s+/g, '').replace(/열|번/g, '');
    const sectionMatch = clean.match(/^[A-C]/);
    const section = sectionMatch ? sectionMatch[0] : '';
    const remaining = sectionMatch ? clean.slice(1) : clean;

    const parts = remaining.split('-');
    if (parts.length === 2) {
      const row = parseInt(parts[0], 10);
      const num = parseInt(parts[1], 10);
      if (!isNaN(row) && !isNaN(num)) {
        return section ? `${section} ${row}-${num}` : `${row}-${num}`;
      }
    }
    return clean;
  };

  const loadInitialData = async () => {
    const db = await initDB();
    const savedData = await db.getAll(STORE_NAME);

    if (savedData.length === 0) {
      for (const item of defaultInitialData) {
        await db.put(STORE_NAME, item);
      }
      setSchedules(defaultInitialData);
    } else {
      const mergedData = defaultInitialData.map(defaultItem => {
        const found = savedData.find(s => s.id === defaultItem.id);
        return found ? { ...defaultItem, ...found } : defaultItem;
      });

      for (const item of mergedData) {
        await db.put(STORE_NAME, item);
      }
      setSchedules(mergedData.sort((a, b) => a.id - b.id));
    }

    const savedBonuses = await db.get(SETTING_STORE, 'cardBonuses');
    if (savedBonuses) setCardBonuses(savedBonuses.value || {});

    const savedCards = await db.get(SETTING_STORE, 'extraCards');
    if (savedCards) setExtraCards(savedCards.value || 0);

    const savedCardCollapsed = await db.get(SETTING_STORE, 'cardCollapsedMap');
    if (savedCardCollapsed) setCardCollapsedMap(savedCardCollapsed.value || {});

    const savedMonthCollapsed = await db.get(SETTING_STORE, 'monthCollapsedMap');
    if (savedMonthCollapsed) setMonthCollapsedMap(savedMonthCollapsed.value || {});

    const savedCalendarCollapsed = await db.get(SETTING_STORE, 'calendarCollapsedMap');
    if (savedCalendarCollapsed) {
      setCalendarCollapsedMap(savedCalendarCollapsed.value || { 12: false, 1: false });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCardBonusChange = async (cardNum, changeAmount) => {
    const currentVal = cardBonuses[cardNum] || 0;
    const nextVal = Math.max(0, currentVal + changeAmount);
    const updatedBonuses = { ...cardBonuses, [cardNum]: nextVal };

    setCardBonuses(updatedBonuses);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'cardBonuses', value: updatedBonuses });
  };

  const toggleSingleCardCollapse = async (cardNum) => {
    const currentState = Boolean(cardCollapsedMap[cardNum]);
    const updatedMap = { ...cardCollapsedMap, [cardNum]: !currentState };

    setCardCollapsedMap(updatedMap);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: updatedMap });
  };

  const toggleMonthCollapse = async (monthNum) => {
    const currentState = Boolean(monthCollapsedMap[monthNum]);
    const updatedMap = { ...monthCollapsedMap, [monthNum]: !currentState };

    setMonthCollapsedMap(updatedMap);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: updatedMap });
  };

  const toggleCalendarCollapse = async (monthNum) => {
    const currentState = Boolean(calendarCollapsedMap[monthNum]);
    const updatedMap = { ...calendarCollapsedMap, [monthNum]: !currentState };

    setCalendarCollapsedMap(updatedMap);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'calendarCollapsedMap', value: updatedMap });
  };

  const handleAddExtraCard = async () => {
    const nextVal = extraCards + 1;
    setExtraCards(nextVal);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'extraCards', value: nextVal });
  };

  const handleRemoveExtraCard = async () => {
    if (extraCards <= 0) return;
    const nextVal = extraCards - 1;
    setExtraCards(nextVal);
    const db = await initDB();
    await db.put(SETTING_STORE, { key: 'extraCards', value: nextVal });
  };

  const handleSeatChange = async (id, value) => {
    const formatted = formatSeatInput(value);
    const updated = schedules.map(item => item.id === id ? { ...item, seat: formatted } : item);
    setSchedules(updated);

    const db = await initDB();
    const targetItem = updated.find(item => item.id === id);
    if (targetItem) {
      await db.put(STORE_NAME, targetItem);
    }
  };

  const handleCardTargetChange = async (targetId, value) => {
    const targetCardNum = Number(value);

    const updated = schedules.map((item, idx) => {
      const targetIndex = schedules.findIndex(s => s.id === targetId);
      if (item.id === targetId) return { ...item, cardTarget: targetCardNum };
      if (idx > targetIndex && (!item.seat || item.seat.trim() === "")) {
        return { ...item, cardTarget: targetCardNum };
      }
      return item;
    });

    setSchedules(updated);
    const db = await initDB();
    for (const item of updated) {
      await db.put(STORE_NAME, item);
    }
  };

  const handleAllSave = async () => {
    const db = await initDB();
    for (const item of schedules) {
      await db.put(STORE_NAME, item);
    }
    await db.put(SETTING_STORE, { key: 'cardBonuses', value: cardBonuses });
    await db.put(SETTING_STORE, { key: 'extraCards', value: extraCards });
    await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: cardCollapsedMap });
    await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: monthCollapsedMap });
    await db.put(SETTING_STORE, { key: 'calendarCollapsedMap', value: calendarCollapsedMap });
    alert('뮤지컬 언더 문보우 스케줄 및 관람 내역이 저장되었습니다! 💾');
  };

  const handleCastInfoClick = (item) => {
    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const allActors = getCleanCastString(item);
    const copyText = `${formattedDate} ${allActors}`.trim();

    navigator.clipboard.writeText(copyText)
      .then(() => alert(`클립보드 복사 완료: "${copyText}" 📋`))
      .catch(err => alert("복사 실패: " + err));
  };

  const handleCaptureImage = async () => {
    const targetEl = document.getElementById('moonbow-capture-target');
    if (!targetEl) return;

    try {
      setIsCapturing(true);

      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#040509',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const captureNode = clonedDoc.getElementById('moonbow-capture-target');
          if (captureNode) {
            captureNode.style.margin = '0';
          }
        }
      });

      const imageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = `under_moonbow_settlement_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('캡처 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportFile = () => {
    if (schedules.length === 0) return alert('백업할 데이터가 없습니다.');
    const backupObject = {
      schedules,
      cardBonuses,
      extraCards,
      cardCollapsedMap,
      monthCollapsedMap,
      calendarCollapsedMap
    };
    const dataStr = JSON.stringify(backupObject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `undermoonbow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const scheduleList = Array.isArray(importedData) ? importedData : importedData.schedules;
        if (!Array.isArray(scheduleList)) throw new Error('올바른 백업 형식이 아닙니다.');

        if (window.confirm('기존 기록을 덮어쓰고 복구하시겠습니까?')) {
          const db = await initDB();
          await db.clear(STORE_NAME);
          for (const item of scheduleList) {
            await db.put(STORE_NAME, { ...item, seat: formatSeatInput(item.seat), cardTarget: item.cardTarget || 1 });
          }

          if (importedData.cardBonuses) await db.put(SETTING_STORE, { key: 'cardBonuses', value: importedData.cardBonuses });
          if (importedData.extraCards !== undefined) await db.put(SETTING_STORE, { key: 'extraCards', value: importedData.extraCards });
          if (importedData.cardCollapsedMap) await db.put(SETTING_STORE, { key: 'cardCollapsedMap', value: importedData.cardCollapsedMap });
          if (importedData.monthCollapsedMap) await db.put(SETTING_STORE, { key: 'monthCollapsedMap', value: importedData.monthCollapsedMap });
          if (importedData.calendarCollapsedMap) await db.put(SETTING_STORE, { key: 'calendarCollapsedMap', value: importedData.calendarCollapsedMap });

          alert('복구가 완료되었습니다! 📂');
          loadInitialData();
        }
      } catch (error) {
        alert('파일 읽기 실패: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('정말 기본 상태로 초기화하시겠습니까?')) {
      const db = await initDB();
      await db.clear(STORE_NAME);
      await db.clear(SETTING_STORE);
      setCardBonuses({});
      setExtraCards(0);
      setCardCollapsedMap({});
      setMonthCollapsedMap({});
      setCalendarCollapsedMap({ 12: false, 1: false });
      loadInitialData();
      alert('초기화되었습니다.');
    }
  };

  const handleOpenCopyModal = (item) => {
    setSelectedItem(item);
    setTicketFee(2000);

    const defaultDiscount = "조기예매 25%";

    setModalInputs(prev => ({
      ...prev,
      transferSeat: item.seat || '',
      discountType: defaultDiscount,
      price: calcDiscountPrice(defaultDiscount, 2000),
      notice: '증빙 필요, 찾아드릴 수 없습니다',
      twitterTag: '@YeonMyuticket'
    }));
    setIsModalOpen(true);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleDiscountChange = (e) => {
    const selectedDiscount = e.target.value;
    setModalInputs(prev => ({
      ...prev,
      discountType: selectedDiscount,
      price: calcDiscountPrice(selectedDiscount, ticketFee)
    }));
  };

  const handleFeeChange = (newFee) => {
    setTicketFee(newFee);
    setModalInputs(prev => ({
      ...prev,
      price: calcDiscountPrice(prev.discountType, newFee)
    }));
  };

  const executeFinalCopy = () => {
    if (!selectedItem) return;
    const item = selectedItem;
    const finalSeat = modalInputs.transferSeat.trim() === "" ? "미입력 좌석" : modalInputs.transferSeat;

    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const allActorsList = getCleanCastString(item);
    const noticeText = modalInputs.notice.trim() ? ` (${modalInputs.notice.trim()})` : '';

    const copyText = `${modalInputs.musicalName} 양도\n\n${formattedDate} ${item.time}\n${allActorsList}\n${finalSeat}\n${modalInputs.discountType} ${modalInputs.price}${noticeText}\n${modalInputs.twitterTag}`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        alert(`${item.date} 회차 양도 문구가 복사되었습니다! 📋`);
        setIsModalOpen(false);
      })
      .catch(err => alert("복사 실패: " + err));
  };

  const handleOpenExchangeModal = (item) => {
    setExchangeItem(item);
    const [monthStr, dayStr] = item.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const timeOfDay = getTimeOfDay(item.time);
    const allActors = getCleanCastString(item);

    setSelectedTargetScheduleId('');
    setExchangeInputs({
      musicalName: '뮤지컬 언더 문보우',
      myDateInfo: `${formattedDate} ${timeOfDay} ${allActors}`.trim(),
      mySeat: item.seat || '',
      targetDates: '',
      targetSeats: '',
      bottomNote: '맘찍 후 디엠 주세요'
    });
    setIsExchangeModalOpen(true);
  };

  const handleExchangeInputChange = (e) => {
    const { name, value } = e.target;
    setExchangeInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTargetSchedule = () => {
    if (!selectedTargetScheduleId) return;
    const targetObj = schedules.find(s => s.id === Number(selectedTargetScheduleId));
    if (!targetObj) return;

    const [monthStr, dayStr] = targetObj.date.split('.');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}`;
    const timeSimple = formatTimeSimple(targetObj.time);
    const allActors = getCleanCastString(targetObj);

    const formattedLine = `${formattedDate} ${targetObj.day} ${timeSimple} ${allActors}`.trim();

    setExchangeInputs(prev => ({
      ...prev,
      targetDates: prev.targetDates ? `${prev.targetDates}\n${formattedLine}` : formattedLine
    }));
  };

  const executeExchangeCopy = () => {
    if (!exchangeItem) return;
    const mySeatFinal = exchangeInputs.mySeat.trim() || '미입력 좌석';
    const targetDatesFinal = exchangeInputs.targetDates.trim() || '협의';
    const targetSeatsFinal = exchangeInputs.targetSeats.trim();

    let targetSection = `😇\n${targetDatesFinal}`;
    if (targetSeatsFinal) {
      targetSection += `\n${targetSeatsFinal}`;
    }

    const copyText = `${exchangeInputs.musicalName} 교환\n\n저\n${exchangeInputs.myDateInfo}\n${mySeatFinal}\n\n${targetSection}\n\n${exchangeInputs.bottomNote}`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        alert(`교환 문구가 클립보드에 복사되었습니다! 📋`);
        setIsExchangeModalOpen(false);
      })
      .catch(err => alert("복사 실패: " + err));
  };

  const watchedShows = schedules.filter(item => item.seat && item.seat.trim() !== "");
  const leeJinHyukCount = watchedShows.filter(item => item.gilmohyun === "이진혁").length;
  const totalLeeJinHyuk = schedules.filter(item => item.gilmohyun === "이진혁").length;

  const maxTargetedCard = useMemo(() => {
    return watchedShows.reduce((max, cur) => Math.max(max, cur.cardTarget || 1), 1);
  }, [watchedShows]);

  const totalCardBoards = useMemo(() => {
    return Math.max(1, maxTargetedCard, 1 + extraCards);
  }, [maxTargetedCard, extraCards]);

  const cardBoardStats = useMemo(() => {
    const cards = [];
    for (let c = 1; c <= totalCardBoards; c++) {
      const cardShows = watchedShows.filter(item => (item.cardTarget || 1) === c);
      const earnedStamps = cardShows.length;
      const thisBonus = cardBonuses[c] || 0;
      cards.push({
        cardNumber: c,
        shows: cardShows,
        stamps: earnedStamps + thisBonus,
        bonus: thisBonus,
        earnedStamps,
        isCollapsed: Boolean(cardCollapsedMap[c])
      });
    }
    return cards;
  }, [totalCardBoards, watchedShows, cardBonuses, cardCollapsedMap]);

  // 최인하 · 길모현 페어 현황 통계
  const pairStats = useMemo(() => {
    const map = {};
    schedules.forEach(item => {
      const pairKey = `${item.choinha} · ${item.gilmohyun}`;
      if (!map[pairKey]) {
        map[pairKey] = { key: pairKey, choinha: item.choinha, gilmohyun: item.gilmohyun, total: 0, watched: 0 };
      }
      map[pairKey].total += 1;
      if (item.seat && item.seat.trim() !== '') map[pairKey].watched += 1;
    });

    const allPairs = Object.values(map);
    const query = searchActor.trim();
    if (!query) return allPairs.sort((a, b) => b.total - a.total);

    return allPairs
      .filter(p => p.choinha.includes(query) || p.gilmohyun.includes(query))
      .sort((a, b) => b.total - a.total);
  }, [schedules, searchActor]);

  const filteredSchedules = schedules.filter(item => {
    if (!searchActor.trim()) return true;
    const query = searchActor.trim();
    const castString = getCleanCastString(item);

    if (query.includes('/')) {
      const keywords = query.split('/').map(k => k.trim()).filter(Boolean);
      return keywords.every(kw => castString.includes(kw));
    }
    return castString.includes(query);
  });

  const getSeatVisitCount = (section, row, num) => {
    return schedules.filter(s => {
      if (!s.seat) return false;
      const clean = s.seat.toUpperCase().replace(/\s+/g, '').replace(/열|번/g, '');
      
      if (clean.startsWith('A') || clean.startsWith('B') || clean.startsWith('C')) {
        const sec = clean[0];
        if (sec !== section) return false;
        const [rStr, nStr] = clean.slice(1).split('-');
        return parseInt(rStr, 10) === row && parseInt(nStr, 10) === num;
      }
      
      if (section === 'B') {
        const [rStr, nStr] = clean.split('-');
        return parseInt(rStr, 10) === row && parseInt(nStr, 10) === num;
      }

      return false;
    }).length;
  };

  // 🪑 좌석 블록 렌더러 (흑백 모노크롬 전용)
  const renderUnderMoonbowSeating = () => {
    const renderSeatBox = (section, row, seatObj) => {
      const visitCount = getSeatVisitCount(section, row, seatObj.num);
      const seatId = `${row}-${seatObj.num}`;

      let statusClass = "bg-[#10131c] text-slate-500 border border-slate-800";
      if (visitCount > 0) {
        statusClass = "bg-white text-black font-black border-white shadow-[0_0_10px_rgba(255,255,255,0.9)]";
      }

      return (
        <div
          key={`${section}-${row}-${seatObj.num}`}
          className={`w-[17px] md:w-[21px] h-[17px] md:h-[21px] text-[7.5px] md:text-[9px] rounded-xs flex items-center justify-center font-mono font-bold flex-shrink-0 cursor-default select-none transition-all ${statusClass}`}
          title={`${section}구역 ${seatId} (${visitCount > 0 ? `${visitCount}회 관람` : '미관람'})`}
        >
          <span className="leading-none text-center block w-full tabular-nums scale-90">{seatId}</span>
        </div>
      );
    };

    const rowsList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    return (
      <div className="flex justify-center items-start gap-3 md:gap-5 min-w-[760px] p-2">
        {/* A구역 */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-2 font-bold text-xs text-slate-400 tracking-widest">
            <span>A SEC</span>
            <span className="text-[10px] opacity-70">♿</span>
          </div>
          <div className="flex flex-col gap-1">
            {rowsList.map(row => {
              const seats = moonbowSeatPlan.A[row];
              if (!seats) return <div key={`A-empty-${row}`} className="h-[17px] md:h-[21px]" />;
              return (
                <div key={`A-row-${row}`} className="flex gap-1 justify-end">
                  {seats.map(s => renderSeatBox('A', row, s))}
                </div>
              );
            })}
          </div>
        </div>

        {/* B구역 */}
        <div className="flex flex-col items-center">
          <div className="font-bold text-xs text-slate-300 mb-2 tracking-widest">B SEC (CENTER)</div>
          <div className="flex flex-col gap-1">
            {rowsList.map(row => {
              const seats = moonbowSeatPlan.B[row];
              if (!seats) return <div key={`B-empty-${row}`} className="h-[17px] md:h-[21px]" />;
              return (
                <div key={`B-row-${row}`} className="flex gap-1 justify-center">
                  {seats.map(s => renderSeatBox('B', row, s))}
                </div>
              );
            })}
          </div>
        </div>

        {/* C구역 */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-2 font-bold text-xs text-slate-400 tracking-widest">
            <span>C SEC</span>
            <span className="text-[10px] opacity-70">♿</span>
          </div>
          <div className="flex flex-col gap-1">
            {rowsList.map(row => {
              const seats = moonbowSeatPlan.C[row];
              if (!seats) return <div key={`C-empty-${row}`} className="h-[17px] md:h-[21px]" />;
              return (
                <div key={`C-row-${row}`} className="flex gap-1 justify-start">
                  {seats.map(s => renderSeatBox('C', row, s))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const generateCalendarDays = (year, month) => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push({ empty: true, key: `empty-${i}` });
    for (let d = 1; d <= lastDate; d++) {
      const formattedD = d < 10 ? `0${d}` : `${d}`;
      const formattedM = month < 10 ? `0${month}` : `${month}`;
      days.push({ empty: false, dayNum: d, dateStr: `${formattedM}.${formattedD}`, key: `day-${month}-${d}` });
    }
    return days;
  };

  return (
    <div className="moonbow-wrapper p-3 md:p-6 lg:p-8 flex flex-col items-center max-w-4xl mx-auto pb-28 selection:bg-[#ff0055] selection:text-white">

      {/* 🏮 홍콩 밤거리 브러시 & 네온 헤더 */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-6 neon-tube-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black border-2 border-[#ff0055] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(255,0,85,0.8)]">
            🌙
          </div>
          <div>
            <span className="text-[11px] neon-sub-title block mb-1">UNDER MOONBOW</span>
            <h1 className="neon-brush-title">
              언더 문보우
            </h1>
          </div>
        </div>

        {/* 링크 버튼 모음 */}
        <div className="flex items-center gap-2 flex-wrap">
          <a href={POSTER_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 btn-neon-sub text-xs">
            포스터
          </a>
          <a href={PROFILE_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 btn-neon-sub text-xs">
            프로필
          </a>
          <a href={SEATING_CHART_LINK} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 btn-neon-tube-cyan text-xs">
            배치도
          </a>
          <a href={FIRST_TICKET_LINK} target="_blank" rel="noopener noreferrer" className="px-4 py-2 btn-neon-tube-red text-xs">
            1차
          </a>
        </div>
      </header>

      {/* 1️⃣ 네온 검색 패널 */}
      <div className="w-full relative mb-5">
        <input
          type="text"
          placeholder="SEARCH ACTOR (예: 이진혁 또는 이진혁/윤지성)"
          value={searchActor}
          onChange={(e) => setSearchActor(e.target.value)}
          className="w-full p-4 text-xs font-bold tracking-wider neon-input-box placeholder:text-slate-500 shadow-xl"
        />
        {searchActor && (
          <button onClick={() => setSearchActor('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center">×</button>
        )}
      </div>

      {/* 2️⃣ 도장판별 적립 섹션 */}
      <section className="w-full neon-tube-card p-5 mb-6">
        <div className="flex items-center justify-between gap-2.5 mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="font-black text-sm text-[#ff0055] tracking-wide flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(255,0,85,0.7)]">
              <span>🎟️</span> STAMP CARD SYSTEM
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              도장판별 개별 접기/펼치기 및 보너스 스탬프 실시간 계산
            </p>
          </div>

          <button
            onClick={handleAddExtraCard}
            className="px-3 py-1.5 btn-neon-tube-red text-xs flex-shrink-0"
          >
            + 새 도장판 추가
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {cardBoardStats.map((board) => (
            <div key={`stamp-card-${board.cardNumber}`} className="p-3.5 bg-[#060810] rounded-xl border border-slate-800">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${board.isCollapsed ? '' : 'mb-3 pb-2 border-b border-slate-800/60'}`}>
                <div
                  onClick={() => toggleSingleCardCollapse(board.cardNumber)}
                  className="flex items-center gap-2 flex-wrap cursor-pointer select-none group"
                >
                  <span className="px-2.5 py-0.5 bg-[#20000a] border border-[#ff0055] text-[#ff0055] text-[10.5px] font-black rounded-md shadow-[0_0_8px_rgba(255,0,85,0.5)]">
                    CARD #{board.cardNumber}
                  </span>
                  <span className="text-xs font-black text-slate-200 group-hover:text-[#00f0ff] transition-colors">
                    {board.cardNumber}번 도장판 ({board.stamps}개 적립)
                  </span>
                  {board.bonus > 0 && (
                    <span className="text-[10px] font-black text-[#00f0ff] bg-[#00171d] border border-[#00f0ff]/50 px-1.5 py-0.2 rounded shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                      보너스 +{board.bonus}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-bold ml-1">
                    {board.isCollapsed ? '▶ 열기' : '▼ 닫기'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center bg-black border border-slate-700 rounded-lg px-2 py-0.5 gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-400">보너스</span>
                    <button onClick={() => handleCardBonusChange(board.cardNumber, -1)} className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-white rounded font-black text-[10px]">-</button>
                    <span className="font-black text-[#ff0055] px-1 text-xs drop-shadow-[0_0_6px_rgba(255,0,85,0.8)]">{board.bonus}</span>
                    <button onClick={() => handleCardBonusChange(board.cardNumber, 1)} className="w-4 h-4 bg-[#ff0055] hover:bg-red-600 text-white rounded font-black text-[10px] shadow-[0_0_8px_rgba(255,0,85,0.9)]">+</button>
                  </div>

                  {board.cardNumber > 1 && (
                    <button onClick={handleRemoveExtraCard} className="text-[10px] font-bold text-rose-500 hover:underline pl-1">
                      제거
                    </button>
                  )}
                </div>
              </div>

              {!board.isCollapsed && (
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="font-black text-slate-500">배정된 회차:</span>
                    {board.shows.length === 0 ? (
                      <span className="text-slate-600">선택된 회차가 없습니다</span>
                    ) : (
                      board.shows.map(s => (
                        <span key={`mapped-tag-${s.id}`} className="bg-[#140008] text-[#ff80a0] border border-[#ff0055]/40 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          {s.date}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3️⃣ 회차 스케줄 목록 */}
      <main className="w-full flex flex-col gap-6 text-sm mb-6">
        {[12, 1].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          const isMonthCollapsed = Boolean(monthCollapsedMap[m]);

          return (
            <div key={`month-schedule-${m}`} className="neon-tube-card overflow-hidden transition-all">
              <div
                onClick={() => toggleMonthCollapse(m)}
                className="p-3.5 bg-black/90 text-[#00f0ff] font-black text-center text-xs tracking-[0.25em] uppercase flex items-center justify-center gap-2 cursor-pointer select-none hover:bg-[#060a14] border-b border-slate-800"
              >
                <span className="text-[#ff0055] drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]">✦</span>
                {m}월 회차 스케줄 ({monthSchedules.length}회)
                <span className="text-[10px] text-[#ff0055] font-bold ml-1">
                  {isMonthCollapsed ? '▶ 펼치기' : '▼ 접기'}
                </span>
                <span className="text-[#ff0055] drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]">✦</span>
              </div>

              {!isMonthCollapsed && (
                <div className="w-full select-none p-3 flex flex-col gap-2">
                  {monthSchedules.map((item) => {
                    const isWatched = item.seat && item.seat.trim() !== "";

                    return (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-2 neon-slot-item">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex flex-col items-start flex-shrink-0">
                            <span className="font-black text-slate-100 text-xs tabular-nums">{item.date} ({item.day})</span>
                            <span className="text-[9px] text-[#00f0ff] bg-[#021317] border border-[#00f0ff]/40 px-1.5 py-0.2 mt-0.5 rounded-xs tabular-nums font-mono font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]">{item.time}</span>
                          </div>

                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-300 truncate">
                                <span className="text-[10px] text-slate-500 font-normal">최인하: </span>{item.choinha}
                              </span>
                              <span className="text-slate-600">/</span>
                              <span className={`text-xs font-bold truncate ${item.gilmohyun === '이진혁' ? 'text-[#ff0055] font-black underline underline-offset-4 drop-shadow-[0_0_8px_rgba(255,0,85,0.9)]' : 'text-slate-300'}`}>
                                <span className="text-[10px] text-slate-500 font-normal">길모현: </span>{item.gilmohyun}
                              </span>
                              <span className="text-slate-600">/</span>
                              <span className="text-xs font-bold text-slate-400 truncate">
                                <span className="text-[10px] text-slate-500 font-normal">백경감: </span>{item.baekgyeonggam}
                              </span>
                              <span className="text-slate-600">/</span>
                              <span className="text-xs font-bold text-slate-400 truncate">
                                <span className="text-[10px] text-slate-500 font-normal">이창환: </span>{item.ichanghwan}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCastInfoClick(item)}
                                className="ml-1 p-1 bg-black hover:bg-[#ff0055] text-slate-400 hover:text-white text-[10px] rounded border border-slate-700 transition-all active:scale-95"
                                title="클릭 시 정보 복사"
                              >
                                📋
                              </button>
                            </div>

                            <div className="text-[9.5px] text-slate-500 truncate">
                              코러스: {item.chorusM} · {item.chorusF}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          <input
                            type="text"
                            placeholder="좌석"
                            value={item.seat || ""}
                            onChange={(e) => handleSeatChange(item.id, e.target.value)}
                            className="w-14 sm:w-16 p-1 text-xs text-center font-black uppercase placeholder:font-normal placeholder:text-[9px] h-7 neon-input-box"
                          />

                          <select
                            value={item.cardTarget || 1}
                            onChange={(e) => handleCardTargetChange(item.id, e.target.value)}
                            disabled={!isWatched}
                            className={`p-1 text-[10px] border rounded-lg font-black h-7 focus:outline-none ${
                              isWatched
                                ? 'border-[#ff0055] bg-[#20000a] text-[#ff80a0] cursor-pointer shadow-[0_0_10px_rgba(255,0,85,0.7)]'
                                : 'border-slate-800 bg-[#060810] text-slate-600 opacity-50'
                            }`}
                          >
                            {Array.from({ length: Math.max(3, totalCardBoards) }).map((_, i) => (
                              <option key={`card-opt-${i+1}`} value={i+1} className="bg-black text-slate-200">{i+1}번</option>
                            ))}
                          </select>

                          <button onClick={() => handleOpenCopyModal(item)} className="px-2 py-1 text-[10px] btn-neon-tube-red h-7 flex items-center justify-center">양도</button>
                          <button onClick={() => handleOpenExchangeModal(item)} className="px-2 py-1 text-[10px] btn-neon-tube-cyan h-7 flex items-center justify-center font-bold">교환</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* 🗓️ 캘린더 뷰 */}
      <section className="w-full flex flex-col gap-6 mb-6">
        {[12, 1].map(m => {
          const monthSchedules = filteredSchedules.filter(item => item.month === m);
          if (monthSchedules.length === 0) return null;
          const isCalendarCollapsed = Boolean(calendarCollapsedMap[m]);
          const year = m === 12 ? 2026 : 2027;

          return (
            <div key={`cal-section-${m}`} className="neon-tube-card overflow-hidden">
              <div
                onClick={() => toggleCalendarCollapse(m)}
                className="p-3.5 bg-black/90 text-[#00f0ff] font-black text-center text-xs tracking-[0.25em] uppercase flex items-center justify-center gap-2 cursor-pointer select-none hover:bg-[#060a14] border-b border-slate-800"
              >
                <span>🗓️</span>
                {year}년 {m}월 캘린더
                <span className="text-[10px] text-[#ff0055] font-bold ml-1">
                  {isCalendarCollapsed ? '▶ 펼치기' : '▼ 접기'}
                </span>
              </div>

              {!isCalendarCollapsed && (
                <div className="p-4">
                  <div className="grid grid-cols-7 text-center font-black text-[11px] text-slate-400 mb-2">
                    <span className="text-[#ff0055] drop-shadow-[0_0_6px_rgba(255,0,85,0.8)]">일</span>
                    <span>월</span>
                    <span>화</span>
                    <span>수</span>
                    <span>목</span>
                    <span>금</span>
                    <span className="text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]">토</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {generateCalendarDays(year, m).map((dayObj) => {
                      if (dayObj.empty) return <div key={dayObj.key} className="h-20 md:h-24 bg-transparent" />;

                      const dayShows = monthSchedules.filter(s => s.date === dayObj.dateStr);
                      const hasShows = dayShows.length > 0;

                      return (
                        <div
                          key={dayObj.key}
                          className={`p-1.5 border rounded-lg flex flex-col justify-between overflow-hidden transition-all ${
                            hasShows
                              ? 'min-h-[120px] md:min-h-[140px] bg-[#070b14] border-[#ff0055]/60 shadow-[0_0_14px_rgba(255,0,85,0.2)]'
                              : 'h-20 md:h-24 bg-[#030408] border-slate-900 opacity-50'
                          }`}
                        >
                          <div className="flex justify-start items-center">
                            <span className="text-[10px] md:text-[11px] font-black text-slate-400 tabular-nums">{dayObj.dayNum}</span>
                          </div>

                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px] text-[8px] md:text-[9px]">
                            {hasShows && dayShows.map(show => {
                              const isWatched = show.seat && show.seat.trim() !== "";
                              return (
                                <div
                                  key={`cal-show-${show.id}`}
                                  className={`p-1 rounded-xs font-bold flex flex-col ${
                                    isWatched
                                      ? 'bg-[#ff0055] text-white shadow-[0_0_10px_rgba(255,0,85,0.9)]'
                                      : 'bg-black text-slate-300 border border-slate-800'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[7px] font-black">● {show.time.substring(0, 5)}</span>
                                    {isWatched && <span className="text-[7px]">✓</span>}
                                  </div>
                                  <div className="text-[7px] md:text-[8px] leading-tight font-medium pl-0.5 text-slate-200 truncate">
                                    <span>{show.choinha}</span>,{' '}
                                    <span className={show.gilmohyun === '이진혁' ? 'font-black text-[#00f0ff]' : ''}>{show.gilmohyun}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* 📸 [📸 캡처 대상: 네온사인 정산판] */}
      <div 
        id="moonbow-capture-target" 
        className="w-full flex flex-col items-center"
        style={{ 
          backgroundColor: '#040509', 
          padding: '24px 16px', 
          boxSizing: 'border-box',
          width: '100%' 
        }}
      >
        {/* 네온 간판 타이틀 바 */}
        <div className="w-full neon-tube-card py-5 px-4 mb-5 text-center border-2 border-[#ff0055] shadow-[0_0_35px_rgba(255,0,85,0.45)]">
          <div className="text-[10px] text-[#00f0ff] font-black tracking-[0.35em] uppercase mb-1 drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]">UNDER MOONBOW REPORT</div>
          <h2 className="neon-brush-title">
            언더 문보우 관람 정산
          </h2>
        </div>

        {/* 관람 합계 */}
        <section className="w-full neon-tube-card p-5 flex justify-around text-center mb-5 border-[#ff0055]/60">
          <div className="flex-1 border-r border-slate-800">
            <p className="text-xs font-black text-[#ff0055] tracking-wider drop-shadow-[0_0_8px_rgba(255,0,85,0.7)]">이진혁 배우 관람</p>
            <p className="text-3xl font-black mt-1 text-white">{leeJinHyukCount} <span className="text-xs font-bold text-slate-500">/ {totalLeeJinHyuk}회</span></p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-[#00f0ff] tracking-wider drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">총 관람합계</p>
            <p className="text-3xl font-black mt-1 text-white">{watchedShows.length} <span className="text-xs font-bold text-slate-500">/ {schedules.length}회</span></p>
          </div>
        </section>

        {/* 최인하 · 길모현 페어 현황 */}
        <section className="w-full neon-tube-card p-5 mb-5 border-[#ff0055]/40">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h2 className="font-black text-xs md:text-sm text-[#ff80a0] tracking-wider flex items-center gap-1.5 uppercase">
              <span>👥</span> {searchActor ? `'${searchActor}' 포함 페어` : '최인하 · 길모현 페어'}
              <span className="text-slate-500 text-[11px] font-mono">({pairStats.length} PAIRS)</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">CHOI IN HA · GIL MO HYUN</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pairStats.map((pair) => {
              const isTarget = pair.gilmohyun === '이진혁';
              return (
                <div
                  key={pair.key}
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                    isTarget
                      ? 'bg-[#1a0008] border-[#ff0055] shadow-[0_0_12px_rgba(255,0,85,0.4)]'
                      : 'bg-black border-slate-800 text-slate-300'
                  }`}
                >
                  <span className={`font-black ${isTarget ? 'text-[#ff99ad]' : 'text-slate-300'}`}>
                    {pair.key}
                  </span>
                  <div className="text-right pl-2">
                    <span className={`font-black text-sm tabular-nums ${pair.watched > 0 ? 'text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]' : 'text-slate-600'}`}>
                      {pair.watched}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 tabular-nums"> / {pair.total}회</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 좌석 배치도 (흑백 모노크롬) */}
        <section className="w-full neon-tube-card p-5 md:p-6 flex flex-col items-center border-slate-800">
          <div className="w-full flex justify-between items-center mb-4">
            <div className="py-1 px-4 bg-slate-900 border border-slate-700 rounded text-[11px] tracking-widest font-bold text-slate-300">
              S T A G E
            </div>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider">
              NOL 서경스퀘어 스콘 2관 (A / B / C구역)
            </span>
          </div>

          <div className="flex gap-4 justify-center items-center mb-4 text-[10px] bg-black/60 px-4 py-1.5 rounded text-slate-400 font-bold border border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#10131c] border border-slate-800 rounded-xs"></div>
              <span>미관람</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-white text-black font-black flex items-center justify-center text-[7px] rounded-xs shadow-[0_0_6px_rgba(255,255,255,0.6)]">
                ✓
              </div>
              <span className="text-white">실관람</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1 w-full select-none p-5 bg-[#050608] rounded-xl border border-slate-800/80 items-center">
              {renderUnderMoonbowSeating()}
            </div>
          </div>
        </section>
      </div>

      {/* 하단 백업 및 복구 바 */}
      <div className="w-full neon-tube-card p-4 flex items-center justify-between text-xs mt-6 border-slate-800">
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportFile} className="px-4 py-2 bg-black hover:bg-[#150207] text-[#ff809b] font-black border border-[#ff0055]/50 transition-all rounded-lg">📥 백업</button>
          <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 btn-neon-tube-red transition-all">📤 복구</button>
          <button onClick={handleCaptureImage} disabled={isCapturing} className="px-4 py-2 btn-neon-tube-cyan transition-all disabled:opacity-50">
            {isCapturing ? '캡처 중...' : '📸 이미지 저장'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
        </div>
        <button onClick={handleReset} className="px-4 py-2 bg-[#1f0007] hover:bg-[#30000b] text-rose-400 font-black border border-rose-600/40 rounded-lg">초기화</button>
      </div>

      {/* 📋 양도 모달 (조기예매 25% 기본값) */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="neon-tube-card w-full max-w-sm overflow-hidden flex flex-col border-2 border-[#ff0055] shadow-[0_0_40px_rgba(255,0,85,0.5)]">
            <div className="bg-black p-4 text-[#ff0055] flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm tracking-wider uppercase flex items-center gap-1 drop-shadow-[0_0_6px_rgba(255,0,85,0.7)]">📋 양도 문구 생성</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedItem.date} {selectedItem.time} 회차</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-xl font-bold text-slate-400 hover:text-white">×</button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 text-xs text-slate-200">
              <div className="flex flex-col gap-1">
                <label className="font-black text-slate-400 text-[11px]">작품명</label>
                <input type="text" name="musicalName" value={modalInputs.musicalName} onChange={handleModalInputChange} className="p-2 neon-input-box font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-[#ff0055] text-[11px] drop-shadow-[0_0_6px_rgba(255,0,85,0.7)]">🕊️ 양도할 좌석</label>
                <input
                  type="text"
                  name="transferSeat"
                  placeholder="예: B구역 2-3 또는 2-3"
                  value={modalInputs.transferSeat}
                  onChange={handleModalInputChange}
                  className="p-2 border-2 border-[#ff0055] bg-[#1a0007] w-full font-black text-white uppercase focus:outline-none shadow-[0_0_12px_rgba(255,0,85,0.5)]"
                />
              </div>

              {/* 예매 수수료 라디오 버튼 */}
              <div className="flex flex-col gap-1.5 p-2.5 bg-black border border-slate-800 rounded-lg">
                <span className="font-black text-slate-400 text-[11px]">🎟️ 예매 수수료 선택</span>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="ticketFee"
                      value={2000}
                      checked={ticketFee === 2000}
                      onChange={() => handleFeeChange(2000)}
                      className="w-3.5 h-3.5 accent-[#ff0055]"
                    />
                    <span className={`font-bold text-[11px] ${ticketFee === 2000 ? 'text-[#ff0055] font-black drop-shadow-[0_0_6px_rgba(255,0,85,0.7)]' : 'text-slate-400'}`}>+2,000원 (기본)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="ticketFee"
                      value={3000}
                      checked={ticketFee === 3000}
                      onChange={() => handleFeeChange(3000)}
                      className="w-3.5 h-3.5 accent-[#ff0055]"
                    />
                    <span className={`font-bold text-[11px] ${ticketFee === 3000 ? 'text-[#ff0055] font-black drop-shadow-[0_0_6px_rgba(255,0,85,0.7)]' : 'text-slate-400'}`}>+3,000원</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-black text-slate-400 text-[11px]">할인 권종</label>
                  <select
                    name="discountType"
                    value={modalInputs.discountType}
                    onChange={handleDiscountChange}
                    className="p-2 neon-input-box font-black text-xs cursor-pointer"
                  >
                    <option value="조기예매 25%" className="bg-black">조기예매 25%</option>
                    <option value="재관람할인 25%" className="bg-black">재관람 25%</option>
                    <option value="프리뷰할인 30%" className="bg-black">프리뷰 30%</option>
                    <option value="마티네할인 30%" className="bg-black">마티네 30%</option>
                    <option value="40% 할인권" className="bg-black">40% 할인권</option>
                    <option value="국가유공자/유공할인 50%" className="bg-black">국유할 50%</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-black text-slate-400 text-[11px]">티켓 가격 (수수료포함)</label>
                  <input
                    type="text"
                    name="price"
                    value={modalInputs.price}
                    onChange={handleModalInputChange}
                    className="p-2 neon-input-box text-center font-mono font-black text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-slate-400 text-[11px]">안내 문구</label>
                <input type="text" name="notice" value={modalInputs.notice} onChange={handleModalInputChange} className="p-2 neon-input-box font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-slate-400 text-[11px]">트위터 태그</label>
                <input type="text" name="twitterTag" value={modalInputs.twitterTag} onChange={handleModalInputChange} className="p-2 neon-input-box font-mono font-bold" />
              </div>
            </div>

            <div className="p-4 bg-black border-t border-slate-800 flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black rounded-lg">취소</button>
              <button onClick={executeFinalCopy} className="flex-1 py-2.5 btn-neon-tube-red font-black">📋 문구 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 교환 모달 */}
      {isExchangeModalOpen && exchangeItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="neon-tube-card neon-tube-card-cyan w-full max-w-sm overflow-hidden flex flex-col border-2 border-[#00f0ff] shadow-[0_0_40px_rgba(0,240,255,0.45)]">
            <div className="bg-black p-4 text-[#00f0ff] flex justify-between items-center border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm tracking-wider uppercase flex items-center gap-1 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">🔄 교환 문구 생성</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{exchangeItem.date} {exchangeItem.time} 기준</p>
              </div>
              <button onClick={() => setIsExchangeModalOpen(false)} className="text-xl font-bold text-slate-400 hover:text-white">×</button>
            </div>

            <div className="p-4 flex flex-col gap-3 text-xs text-slate-200 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="font-black text-slate-400 text-[11px]">작품명</label>
                <input type="text" name="musicalName" value={exchangeInputs.musicalName} onChange={handleExchangeInputChange} className="p-2 neon-input-box font-bold" />
              </div>

              <div className="p-3 bg-black border border-slate-800 rounded-lg flex flex-col gap-2">
                <span className="font-black text-[#ff0055] text-[11px] uppercase drop-shadow-[0_0_6px_rgba(255,0,85,0.7)]">👤 [저] 내가 가진 표</span>
                <input
                  type="text"
                  name="myDateInfo"
                  value={exchangeInputs.myDateInfo}
                  onChange={handleExchangeInputChange}
                  className="p-1.5 text-xs neon-input-box font-bold"
                />
                <input
                  type="text"
                  name="mySeat"
                  placeholder="예: B구역 2-3"
                  value={exchangeInputs.mySeat}
                  onChange={handleExchangeInputChange}
                  className="p-1.5 text-xs border border-[#ff0055] bg-[#1a0007] font-black text-white"
                />
              </div>

              <div className="p-3 bg-black border border-slate-800 rounded-lg flex flex-col gap-2">
                <span className="font-black text-[#00f0ff] text-[11px] uppercase drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]">😇 [천사] 구하는 표</span>
                <div className="flex gap-1.5">
                  <select
                    value={selectedTargetScheduleId}
                    onChange={(e) => setSelectedTargetScheduleId(e.target.value)}
                    className="flex-1 p-1.5 text-[10.5px] neon-input-box font-bold"
                  >
                    <option value="">-- 구하는 회차 선택 --</option>
                    {filteredSchedules.map(s => (
                      <option key={`target-opt-${s.id}`} value={s.id} className="bg-black text-slate-200">
                        {s.date} ({s.day}) {formatTimeSimple(s.time)} - {s.choinha}/{s.gilmohyun}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTargetSchedule}
                    className="px-3 py-1 btn-neon-tube-cyan text-[11px] font-black flex-shrink-0"
                  >
                    + 추가
                  </button>
                </div>

                <textarea
                  rows={3}
                  name="targetDates"
                  placeholder="구하는 날짜/회차"
                  value={exchangeInputs.targetDates}
                  onChange={handleExchangeInputChange}
                  className="p-1.5 text-xs neon-input-box font-bold resize-none leading-relaxed"
                />

                <input
                  type="text"
                  name="targetSeats"
                  placeholder="구하는 좌석 (예: B구역 2~5열)"
                  value={exchangeInputs.targetSeats}
                  onChange={handleExchangeInputChange}
                  className="p-1.5 text-xs neon-input-box font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-black text-slate-400 text-[11px]">안내 문구</label>
                <input type="text" name="bottomNote" value={exchangeInputs.bottomNote} onChange={handleExchangeInputChange} className="p-2 neon-input-box font-bold" />
              </div>
            </div>

            <div className="p-4 bg-black border-t border-slate-800 flex gap-2">
              <button onClick={() => setIsExchangeModalOpen(false)} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black rounded-lg">취소</button>
              <button onClick={executeExchangeCopy} className="flex-1 py-2.5 btn-neon-tube-cyan font-black">📋 교환 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 💾 플로팅 네온 버튼 */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={handleAllSave} className="w-16 h-16 rounded-full bg-black hover:bg-[#150005] active:scale-95 text-[#ff0055] flex flex-col items-center justify-center font-black border-2 border-[#ff0055] shadow-[0_0_25px_rgba(255,0,85,0.85)]" title="전체 저장">
          <span className="text-xl">💾</span>
          <span className="text-[9px] leading-tight mt-0.5 tracking-tighter">ALL SAVE</span>
        </button>
      </div>

    </div>
  );
}
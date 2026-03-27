export const TREE = [
  { n:"00", nm:"학기 초 AI 진단 평가", ch:[] },
  { n:"01", nm:"덧셈과 뺄셈", ch:[
    { n:"01", nm:"받아올림이 없는 세 자리 수의 덧셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"add_no_carry"}], std:["E4MATA01B03C05","E4MATA01B03C07"] },
    { n:"02", nm:"받아올림이 한 번 있는 덧셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"add_one_carry"}], std:["E4MATA01B03C05"] },
    { n:"03", nm:"받아올림이 여러 번 있는 덧셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"add_multi"}], std:["E4MATA01B03C05"] },
    { n:"04", nm:"덧셈의 어림셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"estimate"}], std:["E4MATA01B08C20"] },
    { n:"05", nm:"받아내림이 없는 뺄셈", t:"연습", ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"sub_no"}], std:["E4MATA01B03C06"] },
    { n:"09", nm:"대단원 마무리", t:"총괄", ch:[{n:"01",nm:"뚝딱 해결해요",t:"심화",k:"challenge"}], std:["E4MATA01B03C05","E4MATA01B03C06"] },
  ]},
  { n:"02", nm:"평면도형", ch:[{n:"01",nm:"직각을 알아볼까요",t:"연습",ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"right_angle"}]}] },
  { n:"03", nm:"나눗셈", ch:[{n:"01",nm:"똑같이 나누기",t:"연습",ch:[{n:"01",nm:"AI 익힘 문제",t:"연습",k:"division"}]}] },
];

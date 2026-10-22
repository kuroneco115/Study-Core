(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SUBJECTS = [
    "国語・日本語","数学","英語","理科","社会","情報・プログラミング",
    "物理","化学","生物","地学","世界史","日本史","地理","公民",
    "現代文・古典","数学I・A","数学II・B・C","英語資格","大学専門科目",
    "IT・情報資格","簿記・会計","法律・行政","語学","その他"
  ];
  const QUIZZES = {
    "数学":[
      {q:"方程式 3x + 5 = 20 の解は？",o:["x = 3","x = 5","x = 8","x = 15"],a:1,e:"両辺から5を引くと3x=15。3で割ってx=5。"},
      {q:"三角形の内角の和は？",o:["90°","180°","270°","360°"],a:1,e:"ユークリッド平面上の三角形の内角の和は180°。"},
      {q:"2⁴ の値は？",o:["8","12","16","24"],a:2,e:"2⁴ = 2×2×2×2 = 16。"}
    ],
    "英語":[
      {q:"「彼女は毎日勉強する」を表す英文は？",o:["She study every day.","She studies every day.","She studying every day.","She studied every day."],a:1,e:"主語が三人称単数で現在の習慣を表すため、study に -es が付く。"},
      {q:"“important” に最も近い意味は？",o:["重要な","退屈な","危険な","静かな"],a:0,e:"important は「重要な、大切な」という意味。"}
    ],
    "理科":[
      {q:"水の化学式は？",o:["CO₂","O₂","H₂O","NaCl"],a:2,e:"水は水素原子2個と酸素原子1個からなる H₂O。"},
      {q:"植物が光合成に使う気体は？",o:["酸素","二酸化炭素","窒素","水素"],a:1,e:"植物は光エネルギーを利用し、二酸化炭素と水から有機物を作る。"}
    ],
    "情報・プログラミング":[
      {q:"2進数の 1010 を10進数で表すと？",o:["8","10","12","14"],a:1,e:"1010₂ = 1×8 + 0×4 + 1×2 + 0×1 = 10。"},
      {q:"多くのプログラミング言語で、条件分岐に使われるキーワードは？",o:["if","loopだけ","printだけ","importだけ"],a:0,e:"if は条件に応じて処理を分けるために広く使われる。"}
    ],
    "社会":[
      {q:"日本国憲法が施行された年は？",o:["1945年","1946年","1947年","1951年"],a:2,e:"日本国憲法は1946年に公布され、1947年5月3日に施行された。"},
      {q:"地図上で北を示す一般的な方位は？",o:["上","下","左","右"],a:0,e:"一般的な地図は北が上になるように描かれる。"}
    ],
    "国語・日本語":[
      {q:"「簡潔」の意味に最も近いものは？",o:["短く要点がまとまっている","細部まで非常に長い","意味が分かりにくい","感情が激しい"],a:0,e:"簡潔は、表現が短く要点を押さえていること。"}
    ],
    "簿記・会計":[
      {q:"資産が増加したとき、通常の仕訳で記入する側は？",o:["借方","貸方","摘要欄のみ","仕訳しない"],a:0,e:"資産の増加は通常、借方に記入する。取引の内容によって具体的な科目は異なる。"}
    ],
    "英語資格":[
      {q:"“I have lived here for five years.” が表す内容は？",o:["5年後に住む予定","5年間ここに住んでいる","5年前だけ住んだ","毎年引っ越す"],a:1,e:"現在完了形と for five years で、過去から現在まで続く状態を表している。"}
    ]
  };
  const STORAGE_KEY = "study-core-records-v1";
  let records = loadRecords();
  let elapsed = 0, startedAt = null, ticker = null, paused = false, quizIndex = 0, currentQuiz = null, quizAnswered = false;

  function loadRecords() {
    try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  }
  function saveRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); renderAll(); }
  function todayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function fmtMinutes(m) { m = Math.max(0, Math.round(m)); return m >= 60 ? `${Math.floor(m/60)}時間${m%60}分` : `${m}分`; }
  function fmtClock(sec) { sec = Math.max(0, Math.floor(sec)); return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,"0")).join(":"); }
  function toast(message) { const t=$("toast"); t.textContent=message; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2400); }
  function initSubjects() {
    $("subject").innerHTML = SUBJECTS.map(s=>`<option>${esc(s)}</option>`).join("");
    const options = ["数学","英語","理科","社会","国語・日本語","情報・プログラミング","簿記・会計","英語資格"];
    $("quiz-subject").innerHTML = options.map(s=>`<option>${esc(s)}</option>`).join("");
  }
  function showView(name) {
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    const titles={dashboard:"ダッシュボード",study:"学習する",history:"学習履歴",settings:"データ・設定"};
    $("page-title").textContent=titles[name]||"ダッシュボード";
    if(name==="history") renderHistory();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function dailyMinutes(key) { return records.filter(r=>r.date===key).reduce((a,r)=>a+r.minutes,0); }
  function uniqueStudyDays() { return [...new Set(records.filter(r=>r.minutes>0).map(r=>r.date))].sort(); }
  function calcStreak() {
    const days=new Set(uniqueStudyDays()); let d=new Date(); 
    if(!days.has(todayKey(d))) d.setDate(d.getDate()-1);
    let count=0;
    while(days.has(todayKey(d))){count++;d.setDate(d.getDate()-1);}
    return count;
  }
  function totalXP() { return records.reduce((sum,r)=>sum + Math.max(0,Math.round(r.minutes)) + Math.max(0,r.questions)*2 + Math.max(0,r.pages),0); }
  function renderChart() {
    const box=$("weekly-chart"), days=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=todayKey(d);days.push({key,label:["日","月","火","水","木","金","土"][d.getDay()],mins:dailyMinutes(key)});}
    const max=Math.max(30,...days.map(d=>d.mins));
    box.innerHTML=days.map(d=>`<div class="chart-col"><small class="bar-value">${d.mins||""}</small><div class="bar-track"><div class="bar ${d.key===todayKey()?"today":""}" style="height:${Math.max(d.mins?4:0,d.mins/max*100)}%"></div></div><small>${d.label}</small></div>`).join("");
  }
  function renderSubjects() {
    const totals={}; records.forEach(r=>totals[r.subject]=(totals[r.subject]||0)+r.minutes);
    const sorted=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,7), total=sorted.reduce((s,x)=>s+x[1],0);
    $("subject-chart").innerHTML=sorted.length?sorted.map(([s,m])=>`<div class="subject-row"><span title="${esc(s)}">${esc(s.length>9?s.slice(0,9)+"…":s)}</span><div class="subject-track"><div class="subject-fill" style="width:${total?m/Math.max(...sorted.map(x=>x[1]))*100:0}%"></div></div><b>${total?Math.round(m/total*100):0}%</b></div>`).join(""):'<p class="empty">学習を記録すると表示されます。</p>';
  }
  function activityHTML(r, history=false) {
    const dateLabel = r.date;
    const detail = `${esc(r.topic||"学習")} · ${esc(r.subject)} · ${dateLabel} · ${fmtMinutes(r.minutes)} · 問題 ${r.questions} / ページ ${r.pages}` + (r.answered?` · 正答率 ${Math.round(r.correct/r.answered*100)}%`:"");
    return `<div class="activity-row"><div class="activity-dot"></div><div class="activity-main"><strong>${esc(r.topic||r.subject)}</strong><small>${detail}</small></div><div class="activity-time">${fmtMinutes(r.minutes)}</div>${history?`<button class="delete-entry" data-delete="${esc(r.id)}">削除</button>`:""}</div>`;
  }
  function renderRecent() {
    const recent=[...records].sort((a,b)=>b.createdAt-a.createdAt).slice(0,4);
    $("recent-list").innerHTML=recent.length?recent.map(r=>activityHTML(r)).join(""):'<p class="empty">まだ学習記録がありません。最初の学習を始めよう！</p>';
  }
  function renderHistory() {
    const list=[...records].sort((a,b)=>b.createdAt-a.createdAt);
    $("history-list").innerHTML=list.length?list.map(r=>activityHTML(r,true)).join(""):'<p class="empty">学習記録がここに表示されます。</p>';
  }
  function renderAll() {
    const t=todayKey(), today=records.filter(r=>r.date===t);
    const mins=today.reduce((s,r)=>s+r.minutes,0), amount=today.reduce((s,r)=>s+r.questions+r.pages,0);
    const answered=records.reduce((s,r)=>s+r.answered,0), correct=records.reduce((s,r)=>s+r.correct,0);
    $("today-time").innerHTML=`${Math.floor(mins/60)}<span>時間</span> ${mins%60}<span>分</span>`;
    $("today-time-sub").textContent=`今週 ${fmtMinutes(records.filter(r=>{const d=new Date();d.setDate(d.getDate()-6);return r.date>=todayKey(d)}).reduce((s,r)=>s+r.minutes,0))}`;
    $("today-amount").textContent=amount.toLocaleString();
    $("today-amount-sub").textContent=`問題 ${today.reduce((s,r)=>s+r.questions,0)} / ページ ${today.reduce((s,r)=>s+r.pages,0)}`;
    $("accuracy").textContent=answered?`${Math.round(correct/answered*100)}%`:"—";
    $("accuracy-sub").textContent=answered?`${correct.toLocaleString()} / ${answered.toLocaleString()} 問正解`:"回答データなし";
    $("streak").innerHTML=`${calcStreak()}<span>日</span>`;
    renderChart();renderSubjects();renderRecent();renderHistory();
    document.title=`Study Core · ${totalXP().toLocaleString()} XP`;
  }
  function startTimer() {
    if(ticker) return;
    startedAt=Date.now(); paused=false; ticker=setInterval(()=>{elapsed+=(Date.now()-startedAt)/1000;startedAt=Date.now();updateTimer();},250);
    $("timer-start").disabled=true;$("timer-pause").disabled=false;$("timer-status").textContent="FOCUS IN PROGRESS";
  }
  function pauseTimer() {
    if(!ticker)return;
    clearInterval(ticker);ticker=null;paused=true;$("timer-start").disabled=false;$("timer-start").textContent="▶ 再開";$("timer-pause").disabled=true;$("timer-status").textContent="PAUSED";
  }
  function updateTimer(){ $("timer-display").textContent=fmtClock(elapsed); }
  function resetTimer(){if(ticker)clearInterval(ticker);ticker=null;elapsed=0;startedAt=null;paused=false;updateTimer();$("timer-start").disabled=false;$("timer-start").textContent="▶ スタート";$("timer-pause").disabled=true;$("timer-status").textContent="READY TO FOCUS";}
  function addRecord(data) {
    const now=new Date();
    records.push({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,createdAt:now.getTime(),date:data.date||todayKey(now),subject:data.subject,topic:data.topic,minutes:data.minutes,questions:data.questions,pages:data.pages,correct:data.correct,answered:data.answered});
    saveRecords();
  }
  function saveStudyForm(e) {
    e.preventDefault();
    const minutes=Number($("minutes").value), questions=Number($("questions").value)||0, pages=Number($("pages").value)||0, correct=Number($("correct").value)||0, answered=Number($("answered").value)||0;
    if(!Number.isFinite(minutes)||minutes<0||minutes>1440){toast("学習時間は0〜1440分で入力してください。");return;}
    if(correct>answered){toast("正解数は回答した問題数以下にしてください。");return;}
    if(questions<0||pages<0||answered<0||correct<0){toast("数値は0以上で入力してください。");return;}
    addRecord({subject:$("subject").value,topic:$("topic").value.trim(),minutes:Math.round(minutes),questions,pages,correct,answered});
    $("topic").value="";$("questions").value=0;$("pages").value=0;$("correct").value=0;$("answered").value=0;
    resetTimer();toast("学習記録を保存しました！");
  }
  function quizList() { const subject=$("quiz-subject").value; return QUIZZES[subject]||[{q:`「${subject}」の学習を始めよう`,o:["教科書や教材を読む","目標を決める","問題を解いてみる","すべて試して記録する"],a:3,e:"この分野の問題バンクはまだ少ないため、教材で学習し、時間や問題数を記録してください。"}]; }
  function renderQuiz() {
    const list=quizList();currentQuiz=list[quizIndex%list.length];quizAnswered=false;
    $("quiz-question").textContent=currentQuiz.q;
    $("quiz-options").innerHTML=currentQuiz.o.map((o,i)=>`<button class="quiz-option" data-answer="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join("");
    $("quiz-feedback").textContent="";
  }
  function answerQuiz(index) {
    if(quizAnswered)return;quizAnswered=true;
    const buttons=[...$("quiz-options").querySelectorAll("button")];
    buttons.forEach((b,i)=>{if(i===currentQuiz.a)b.classList.add("correct");else if(i===index)b.classList.add("wrong");});
    const ok=index===currentQuiz.a;
    $("quiz-feedback").textContent=(ok?"正解！ ":"もう一度確認しよう。 ")+currentQuiz.e;
    addRecord({subject:$("quiz-subject").value,topic:"ミニ演習",minutes:0,questions:1,pages:0,correct:ok?1:0,answered:1});
  }
  function download(filename,content,type) {
    const blob=new Blob([content],{type}), url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  }
  function exportJSON(){download("study-core-backup.json",JSON.stringify({app:"Study Core",version:1,exportedAt:new Date().toISOString(),records},null,2),"application/json");}
  function exportCSV(){
    const rows=[["日付","教科","学習内容","学習時間(分)","問題数","ページ数","正解数","回答数","正答率(%)"]];
    records.forEach(r=>rows.push([r.date,r.subject,r.topic,r.minutes,r.questions,r.pages,r.correct,r.answered,r.answered?Math.round(r.correct/r.answered*100):""]));
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    download("study-core-history.csv","\uFEFF"+csv,"text/csv;charset=utf-8");
  }
  function importJSON(file) {
    const reader=new FileReader();
    reader.onload=()=>{try{const data=JSON.parse(reader.result);const incoming=Array.isArray(data)?data:data.records;if(!Array.isArray(incoming))throw new Error("format");if(!confirm(`${incoming.length}件の記録を読み込みます。現在の記録に追加しますか？`))return;const ids=new Set(records.map(r=>r.id));incoming.forEach(r=>{if(r&&r.id&&!ids.has(r.id)&&typeof r.subject==="string"&&typeof r.minutes==="number")records.push({...r});});saveRecords();toast("バックアップを読み込みました。");}catch(_){toast("読み込めないファイルです。");}finally{$("import-json").value="";}};
    reader.readAsText(file);
  }
  function init() {
    initSubjects();
    $("today-label").textContent=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});
    document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
    document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
    $("study-form").addEventListener("submit",saveStudyForm);
    $("timer-start").addEventListener("click",startTimer);$("timer-pause").addEventListener("click",pauseTimer);$("timer-reset").addEventListener("click",resetTimer);
    $("quiz-subject").addEventListener("change",()=>{quizIndex=0;renderQuiz();});
    $("new-question").addEventListener("click",()=>{quizIndex++;renderQuiz();});
    $("quiz-options").addEventListener("click",e=>{const b=e.target.closest("[data-answer]");if(b)answerQuiz(Number(b.dataset.answer));});
    $("history-list").addEventListener("click",e=>{const b=e.target.closest("[data-delete]");if(b&&confirm("この学習記録を削除しますか？")){records=records.filter(r=>r.id!==b.dataset.delete);saveRecords();toast("記録を削除しました。");}});
    $("export-json").addEventListener("click",exportJSON);$("export-csv").addEventListener("click",exportCSV);
    $("import-json").addEventListener("change",e=>{if(e.target.files[0])importJSON(e.target.files[0]);});
    $("clear-data").addEventListener("click",()=>{if(confirm("すべての学習記録を削除します。この操作は取り消せません。バックアップはありますか？")){records=[];saveRecords();toast("すべての記録を削除しました。");}});
    renderQuiz();renderAll();
  }
  init();
})();
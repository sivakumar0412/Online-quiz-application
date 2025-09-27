// Utilities
    const $ = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

    const screens = {
      intro: $('#screen-intro'),
      quiz: $('#screen-quiz'),
      results: $('#screen-results'),
      loading: $('#screen-loading'),
    };

    function showScreen(name){
      Object.values(screens).forEach(s => s.classList.remove('active'));
      screens[name].classList.add('active');
    }

    // Sample local questions (fallback)
    const localQuestions = [
      {
        q: "Which HTML element is used to define the title of a document?",
        correct: "title",
        choices: ["head", "meta", "title", "header"]
      },
      {
        q: "Which CSS property controls the text size?",
        correct: "font-size",
        choices: ["font-style", "text-size", "font-size", "text-style"]
      },
      {
        q: "What does JSON stand for?",
        correct: "JavaScript Object Notation",
        choices: ["Java Source Object Notation", "JavaScript Object Notation", "Java Serialized Object Namespace", "JavaScript Oriented Notation"]
      },
      {
        q: "Which method is used to parse a JSON string in JavaScript?",
        correct: "JSON.parse()",
        choices: ["JSON.stringify()", "JSON.read()", "JSON.parse()", "JSON.toObject()"]
      },
      {
        q: "Which array method creates a new array with elements that pass a test?",
        correct: "filter()",
        choices: ["map()", "forEach()", "reduce()", "filter()"]
      },
      {
        q: "In CSS, which unit is relative to the root font size?",
        correct: "rem",
        choices: ["px", "em", "rem", "vh"]
      },
      {
        q: "What is the output of typeof null in JavaScript?",
        correct: "object",
        choices: ["null", "undefined", "object", "number"]
      },
      {
        q: "Which HTTP status code means 'Not Found'?",
        correct: "404",
        choices: ["200", "301", "403", "404"]
      },
      {
        q: "Which tag is used to include external JavaScript?",
        correct: "script",
        choices: ["javascript", "js", "script", "code"]
      },
      {
        q: "Which CSS property is used to change the text color?",
        correct: "color",
        choices: ["font-color", "text-color", "color", "foreground"]
      }
    ];

    // State
    const state = {
      questions: [],
      index: 0,
      score: 0,
      perSeconds: 15,
      remaining: 15,
      interval: null,
      history: [], // { q, choices, correct, picked, isCorrect }
    };

    // Elements
    const scoreHeader = $('#scoreHeader');
    const startBtn = $('#startBtn');
    const nextBtn = $('#nextBtn');
    const skipBtn = $('#skipBtn');
    const restartBtn = $('#restartBtn');
    const reviewBtn = $('#reviewBtn');

    const qTitle = $('#quiz-title');
    const optionsEl = $('.options');
    const feedback = $('#feedback');
    const timerEl = $('#timer');
    const progressEl = $('#progress');
    const qIndexEl = $('#qIndex');
    const qTotalEl = $('#qTotal');
    const reviewEl = $('#review');

    // Settings inputs
    const selNum = $('#num-questions');
    const selPer = $('#per-timer');
    const selDiff = $('#difficulty');
    const selSource = $('#use-api');

    // Helpers
    function shuffle(arr){
      const a = [...arr];
      for(let i=a.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function decode(str){
      try {
        // For opentdb encode=url3986
        return decodeURIComponent(str);
      } catch {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
      }
    }

    function choiceButton(text, index){
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.dataset.index = String(index);
      btn.innerHTML = `<span>${text}</span>`;
      return btn;
    }

    function setFeedback(msg, type){
      feedback.textContent = msg || '';
      feedback.style.color = type === 'good' ? 'var(--accent)' :
                             type === 'bad' ? 'var(--danger)' : 'var(--muted)';
    }

    function updateHeaderScore(){
      scoreHeader.textContent = String(state.score);
    }

    function updateProgress(){
      const pct = ((state.index) / state.questions.length) * 100;
      progressEl.style.width = `${pct}%`;
      qIndexEl.textContent = String(Math.min(state.index+1, state.questions.length));
      qTotalEl.textContent = String(state.questions.length);
    }

    function startTimer(){
      stopTimer();
      state.remaining = state.perSeconds;
      renderTimer();

      state.interval = setInterval(() => {
        state.remaining -= 1;
        renderTimer();
        if (state.remaining <= 0){
          // time's up -> mark unanswered as wrong and move on (show feedback)
          stopTimer();
          lockChoices();
          revealAnswer(null); // no pick
          nextBtn.disabled = false;
        }
      }, 1000);
    }

    function stopTimer(){
      if (state.interval){ clearInterval(state.interval); state.interval = null; }
    }

    function renderTimer(){
      timerEl.textContent = `${state.remaining}s`;
      if (state.remaining <= Math.max(5, Math.floor(state.perSeconds*0.3))){
        timerEl.classList.add('low');
      } else {
        timerEl.classList.remove('low');
      }
    }

    function celebrate(){
      // lightweight confetti: 30 pieces
      const cont = $('#confetti');
      const colors = ['#34d399','#60a5fa','#fbbf24','#f472b6','#a78bfa'];
      for (let i=0;i<30;i++){
        const s = document.createElement('span');
        s.style.left = (Math.random()*100) + 'vw';
        s.style.top = (-Math.random()*20) + 'vh';
        s.style.background = colors[Math.floor(Math.random()*colors.length)];
        s.style.transform = `translateY(-20vh) rotate(${Math.random()*180}deg)`;
        s.style.animationDelay = (Math.random()*200)+'ms';
        s.style.width = (6 + Math.random()*6) + 'px';
        s.style.height = (10 + Math.random()*10) + 'px';
        cont.appendChild(s);
        setTimeout(()=> s.remove(), 1200);
      }
    }

    function makeQuestionObjects(raw){
      // Normalize to { q, choices[], correct }
      return raw.map(item => {
        if (item.q && item.choices) return item; // already normalized (local)
        const correct = decode(item.correct_answer);
        const incorrect = item.incorrect_answers.map(decode);
        const choices = shuffle([correct, ...incorrect]);
        return { q: decode(item.question), choices, correct };
      });
    }

    function renderQuestion(){
      const { index, questions } = state;
      const curr = questions[index];
      updateProgress();
      setFeedback('', null);
      nextBtn.disabled = true;

      qTitle.textContent = curr.q;
      optionsEl.innerHTML = '';
      curr.choices.forEach((c, i) => {
        const btn = choiceButton(c, i);
        btn.addEventListener('click', () => handlePick(c, btn));
        optionsEl.appendChild(btn);
      });

      startTimer();
    }

    function lockChoices(){
      $$('.option', optionsEl).forEach(b => b.disabled = true);
    }

    function revealAnswer(pickedText){
      const curr = state.questions[state.index];
      const isCorrect = pickedText === curr.correct;
      // Mark buttons
      $$('.option', optionsEl).forEach(b => {
        const t = b.textContent.trim();
        if (t === curr.correct){
          b.classList.add('correct');
        } else if (pickedText && t === pickedText){
          b.classList.add('wrong');
        }
      });

      // Score + feedback
      if (isCorrect){
        state.score += 1;
        updateHeaderScore();
        setFeedback('Correct!', 'good');
        celebrate();
      } else {
        setFeedback(`Wrong. Answer: ${curr.correct}`, 'bad');
      }

      // Save history
      state.history[state.index] = {
        q: curr.q,
        choices: curr.choices,
        correct: curr.correct,
        picked: pickedText ?? null,
        isCorrect
      };
    }

    function handlePick(text, btn){
      if (btn.disabled) return;
      stopTimer();
      lockChoices();
      revealAnswer(text);
      nextBtn.disabled = false;
    }

    function nextQuestion(){
      state.index += 1;
      if (state.index >= state.questions.length){
        return finishQuiz();
      }
      renderQuestion();
    }

    function skipQuestion(){
      if (state.interval === null){
        // already graded; just go next
        nextQuestion();
        return;
      }
      stopTimer();
      lockChoices();
      revealAnswer(null);
      nextBtn.disabled = false;
    }

    function finishQuiz(){
      stopTimer();
      const total = state.questions.length;
      const pct = Math.round((state.score/total)*100);
      $('#results-summary').textContent = `You scored ${state.score} / ${total} (${pct}%).`;
      reviewEl.style.display = 'none';
      reviewEl.innerHTML = '';
      showScreen('results');
    }

    function reviewDetails(){
      reviewEl.style.display = 'block';
      if (reviewEl.innerHTML) return;
      state.history.forEach((h, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'card';
        wrap.style.borderColor = h.isCorrect ? 'rgba(16,185,129,.45)' : 'rgba(239,68,68,.45)';
        wrap.style.background = 'rgba(2,6,23,.35)';
        const inner = document.createElement('div');
        inner.className = 'card-body';
        inner.innerHTML = `
          <div class="row" style="justify-content:space-between;align-items:center;">
            <strong>Q${idx+1}</strong>
            <span class="pill">${h.isCorrect ? 'Correct' : 'Wrong'}</span>
          </div>
          <div style="margin-top:8px; font-weight:700">${h.q}</div>
          <div class="options" style="margin-top:8px;">
            ${h.choices.map(c => {
              const role = c === h.correct ? ' (answer)' : (c === h.picked ? ' (you)' : '');
              const cls  = c === h.correct ? 'correct' : (c === h.picked ? 'wrong' : '');
              return `<button class="option ${cls}" disabled>${c}${role ? `<span class="sr-only">${role}</span>`:''}</button>`;
            }).join('')}
          </div>
        `;
        wrap.appendChild(inner);
        reviewEl.appendChild(wrap);
      });
    }

    async function fetchFromAPI(amount, difficulty){
      const url = new URL('https://opentdb.com/api.php');
      url.searchParams.set('amount', String(amount));
      url.searchParams.set('type', 'multiple');
      url.searchParams.set('encode', 'url3986');
      if (difficulty) url.searchParams.set('difficulty', difficulty);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      if (data.response_code !== 0) throw new Error('No questions available for selected filters');
      return data.results;
    }

    function resetState(){
      state.index = 0;
      state.score = 0;
      state.history = [];
      updateHeaderScore();
      progressEl.style.width = '0%';
      setFeedback('', null);
    }

    async function startQuiz(){
      resetState();
      const count = Number(selNum.value);
      const per = Number(selPer.value);
      const source = selSource.value;
      const difficulty = selDiff.value || '';
      state.perSeconds = per;

      if (source === 'api'){
        showScreen('loading');
        try {
          const apiRaw = await fetchFromAPI(count, difficulty);
          state.questions = makeQuestionObjects(apiRaw).slice(0, count);
        } catch (e){
          alert('Could not load from API. Falling back to local questions.\n\n' + (e?.message || e));
          state.questions = makeQuestionObjects(shuffle(localQuestions)).slice(0, count);
        }
      } else {
        state.questions = makeQuestionObjects(shuffle(localQuestions)).slice(0, count);
      }

      qTotalEl.textContent = String(state.questions.length);
      showScreen('quiz');
      renderQuestion();
    }

    function restart(){
      showScreen('intro');
    }

    // Events
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    skipBtn.addEventListener('click', skipQuestion);
    restartBtn.addEventListener('click', restart);
    reviewBtn.addEventListener('click', reviewDetails);

    // Keyboard shortcuts: 1-4 answers, n=next, s=skip
    document.addEventListener('keydown', (e) => {
      if (!screens.quiz.classList.contains('active')) return;
      if (['1','2','3','4'].includes(e.key)){
        const idx = Number(e.key) - 1;
        const btn = $$('.option', optionsEl)[idx];
        if (btn) btn.click();
      } else if (e.key.toLowerCase() === 'n'){
        if (!nextBtn.disabled) nextBtn.click();
      } else if (e.key.toLowerCase() === 's'){
        skipBtn.click();
      }
    });
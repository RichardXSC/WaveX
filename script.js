/* WaveX — Reliable MVP: 4K play, editor, community, profile, options (non-module script) */
(function(){
  const SERVER_URL = 'https://wavex-7f4p.onrender.com';
  const KEY_TO_LANE={d:1,f:2,j:3,k:4}; const LANE_TO_KEY={1:'D',2:'F',3:'J',4:'K'};
  const JUDGE_MS={perfect:30,great:60,good:100,miss:150}; const SCORE={perfect:1000,great:600,good:200,miss:0}; const ACC={perfect:1, great:0.7, good:0.4, miss:0};
  const SKEY={profile:'wavex_profile_v1', charts:'wavex_charts_v1', community:'wavex_community_v1', options:'wavex_options_v1', leader:'wavex_leaderboards_v1'};
  const DefaultProfile={username:'Guest',avatar:'',xp:0,level:1,plays:0,bestAcc:0,achievements:{},unlocks:{themes:['neon']}};
  const DefaultOptions={volume:0.8,hitVolume:0.8,speed:6,mirror:false,fadeIn:false,health:true,theme:'neon'};
  const BuiltIn=[
    { id:'tutorial', title:'Tutorial Beat', artist:'WaveX', difficulty:'Easy', mp3:'', offset:0,
      notes:Array.from({length:64},(_,i)=>({time:0.6+i*0.5,lane:(i%4)+1})) },
    { id:'random-blitz', title:'Random Blitz', artist:'WaveX', difficulty:'Normal', mp3:'', offset:0,
      notes:(()=>{ let t=0.6; const arr=[]; for(let i=0;i<180;i++){ t+=0.28+Math.random()*0.12; arr.push({ time:Number(t.toFixed(2)), lane: 1 + (Math.random()*4|0) }); } return arr; })() },
    { id:'teto-medicine', title:'Teto Medicine', artist:'IGAKU イガク', difficulty:'Hard', mp3:'Main_Levels/Teto Medicine/Teto Medicine1.mp3', artwork:'Main_Levels/Teto Medicine/Medicine_album_cover.jpg', youtube:'https://www.youtube.com/embed/WPh2bWFxUz0', offset:0, notes:[
      {time:1.0,lane:1},{time:1.5,lane:2},{time:2.0,lane:3},{time:2.5,lane:4},
      {time:3.0,lane:1},{time:3.5,lane:2},{time:4.0,lane:3},{time:4.5,lane:4},
      {time:5.0,lane:1},{time:5.5,lane:2},{time:6.0,lane:3},{time:6.5,lane:4},
      {time:7.0,lane:1},{time:7.5,lane:2},{time:8.0,lane:3},{time:8.5,lane:4},
      {time:9.0,lane:1},{time:9.5,lane:2},{time:10.0,lane:3},{time:10.5,lane:4},
      {time:11.0,lane:1},{time:11.5,lane:2},{time:12.0,lane:3},{time:12.5,lane:4},
      {time:13.0,lane:1},{time:13.5,lane:2},{time:14.0,lane:3},{time:14.5,lane:4},
      {time:15.0,lane:1},{time:15.5,lane:2},{time:16.0,lane:3},{time:16.5,lane:4},
      {time:17.0,lane:1},{time:17.5,lane:2},{time:18.0,lane:3},{time:18.5,lane:4},
      {time:19.0,lane:1},{time:19.5,lane:2},{time:20.0,lane:3},{time:20.5,lane:4}
    ] }
  ];
  const $=(q)=>document.querySelector(q); const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); const fmtScore=(n)=>(n|0).toString().padStart(7,'0'); const fmtPct=(p)=>(p*100).toFixed(2)+'%'; const slug=(s)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const Store={get:(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch(e){return f;}}, set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  async function blobToBase64(blob){ const buf = await blob.arrayBuffer(); let binary=''; const bytes=new Uint8Array(buf); const chunk=0x8000; for(let i=0;i<bytes.length;i+=chunk){ binary+=String.fromCharCode.apply(null, bytes.subarray(i,i+chunk)); } return btoa(binary); }
  // Helper function for file to data URL conversion
  async function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // Helper function to load chart data from JSON file
  async function loadChartData(chartPath) {
    try {
      const response = await fetch(chartPath);
      if(response.ok) {
        const chartData = await response.json();
        return chartData.notes || [];
      }
      return [];
    } catch(e) {
      console.warn('Failed to load chart data:', e);
      return [];
    }
  }
  const Options={get(){return Store.get(SKEY.options,DefaultOptions)}, set(v){Store.set(SKEY.options,v); document.body.setAttribute('data-theme', v.theme==='neon'?'':v.theme); Audio.setVolume(v.volume);}};
  const Profile={get(){return Store.get(SKEY.profile,DefaultProfile)}, set(v){Store.set(SKEY.profile,v)}};
  const Charts={
  async list(){
    try {
      const response = await fetch('https://wavex-7f4p.onrender.com/api/charts');
      const serverCharts = await response.json();
      return [...BuiltIn, ...serverCharts];
    } catch (e) {
      console.warn('Failed to fetch server charts, using local:', e);
      return [...BuiltIn, ...Store.get(SKEY.charts,[])];
    }
  },
  save(c){
    const L=Store.get(SKEY.charts,[]); 
    const i=L.findIndex(x=>x.id===c.id); 
    if(i>=0)L[i]=c; 
    else L.push(c); 
    Store.set(SKEY.charts,L);
  },
  async publish(c,a){
    try {
      const chartData = {
        ...c,
        author: a,
        ratings: c.ratings || [],
        createdAt: Date.now()
      };
      
      const response = await fetch('https://wavex-7f4p.onrender.com/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chartData)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Chart published to server:', result);
      
      // Also save locally as backup
      const C=Store.get(SKEY.community,[]); 
      const i=C.findIndex(x=>x.id===c.id); 
      if(i>=0)C[i]=chartData; 
      else C.push(chartData); 
      Store.set(SKEY.community,C);
      
      return true;
    } catch (e) {
      console.error('Failed to publish to server:', e);
      // Fallback to local storage
      const C=Store.get(SKEY.community,[]); 
      const i=C.findIndex(x=>x.id===c.id); 
      const chartData = {...c,author:a,ratings:[],createdAt:Date.now()};
      if(i>=0)C[i]=chartData; 
      else C.push(chartData); 
      Store.set(SKEY.community,C);
      return false;
    }
  },
  async community(){
    try {
      const response = await fetch('https://wavex-7f4p.onrender.com/api/charts');
      const serverCharts = await response.json();
      return serverCharts;
    } catch (e) {
      console.warn('Failed to fetch community charts, using local:', e);
      return Store.get(SKEY.community,[]);
    }
  }
};
  const Boards={get:(id)=>(Store.get(SKEY.leader,{}))[id]||[], put(id,e){const d=Store.get(SKEY.leader,{}); d[id]=[...(d[id]||[]),e].sort((a,b)=>b.score-a.score).slice(0,20); Store.set(SKEY.leader,d);}};

  // Background
  const bgC=$('#bgCanvas'), bgx=bgC.getContext('2d'); const bg={parts:[],phase:0,comboGlow:0, resize(){bgC.width=innerWidth; bgC.height=innerHeight;}, tick(){const w=bgC.width,h=bgC.height; bgx.clearRect(0,0,w,h); this.phase+=0.002; bgx.strokeStyle='rgba(168,85,247,0.12)'; const sp=40,off=Math.sin(this.phase)*20; for(let x=-sp;x<w+sp;x+=sp){ bgx.beginPath(); bgx.moveTo(x+off,0); bgx.lineTo(x-off,h); bgx.stroke(); } for(let y=0;y<h;y+=sp){ bgx.beginPath(); bgx.moveTo(0,y+off); bgx.lineTo(w,y-off); bgx.stroke(); } if(!this.parts.length){ this.parts=Array.from({length:120},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-0.5)*0.15,vy:(Math.random()-0.5)*0.15,r:Math.random()*2+0.5,h:190+Math.random()*160})); } for(const p of this.parts){ p.x+=p.vx;p.y+=p.vy; if(p.x<-10||p.x>w+10||p.y<-10||p.y>h+10){ p.x=Math.random()*w;p.y=Math.random()*h; } bgx.beginPath(); bgx.fillStyle=`hsla(${p.h},90%,60%,${0.15+this.comboGlow*0.3})`; bgx.arc(p.x,p.y,p.r,0,Math.PI*2); bgx.fill(); } requestAnimationFrame(()=>this.tick());}, setCombo(c){this.comboGlow=Math.min(1,c/100);} }; addEventListener('resize',()=>bg.resize()); bg.resize(); requestAnimationFrame(()=>bg.tick());

  // Audio
  const Audio={
    ctx:null,gain:null,mode:'none',el:$('#mp3Audio'),mediaSource:null,yt:null,
    async ensure(){ if(!this.ctx){ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); this.gain=this.ctx.createGain(); this.gain.connect(this.ctx.destination);} },
    setVolume(v){ if(this.gain) this.gain.gain.value=clamp(v,0,1); this.el.volume=clamp(v,0,1); },
    async useMp3(file){ await this.ensure(); this.mode='mp3'; this.el.src=URL.createObjectURL(file); if(!this.mediaSource){ this.mediaSource=this.ctx.createMediaElementSource(this.el); this.mediaSource.connect(this.gain);} },
    async useDataUrl(dataUrl){ await this.ensure(); this.mode='mp3'; this.el.src=dataUrl; if(!this.mediaSource){ this.mediaSource=this.ctx.createMediaElementSource(this.el); this.mediaSource.connect(this.gain);} },
    async useYouTube(url){ 
      await this.ensure(); 
      this.mode='youtube'; 
      // Create YouTube iframe if it doesn't exist
      if(!this.yt) {
        const iframe = document.createElement('iframe');
        iframe.src = url + '?autoplay=0&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=' + url.match(/embed\/([^?]+)/)?.[1];
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.zIndex = '-1';
        iframe.style.pointerEvents = 'none';
        iframe.style.opacity = '0.3';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.title = 'Background Video';
        
        // Wait for iframe to load before adding to DOM
        iframe.onload = () => {
          console.log('YouTube iframe loaded successfully');
        };
        
        document.body.appendChild(iframe);
        this.yt = iframe;
        console.log('YouTube iframe created and added to DOM');
      }
    },
    async play() {
        await this.ensure();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        if (this.mode === 'youtube') {
          // For YouTube, we'll use the MP3 audio but show the video
          if(this.yt) {
            // Extract video ID and create autoplay URL
            const videoId = this.yt.src.match(/embed\/([^?]+)/)?.[1];
            if(videoId) {
              this.yt.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&start=0&mute=1`;
            }
          }
        } else if (this.mode === 'mp3') {
            try {
                // Ensure the audio context is running before playing
                if (this.ctx.state === 'suspended') {
                    await this.ctx.resume();
                }
                await this.el.play();
            } catch (e) {
                console.warn('Audio playback blocked:', e);
                // Optionally, you can still alert the user if playback fails after resume attempt
                // alert('Audio playback blocked. Click anywhere on the page, then try again.');
            }
        }
    },
    pause(){ 
      if(this.mode==='mp3') this.el.pause(); 
      if(this.mode==='youtube' && this.yt) {
        // Pause YouTube video by reloading without autoplay
        const videoId = this.yt.src.match(/embed\/([^?]+)/)?.[1];
        if(videoId) {
          this.yt.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&mute=1`;
        }
      }
    },
    seek(t){ if(this.mode==='mp3') this.el.currentTime=t; },
    time(){ if(this.mode==='mp3') return this.el.currentTime||0; return 0; }
  };
  addEventListener('click', async()=>{ try{ await Audio.ensure(); if(Audio.ctx.state==='suspended') await Audio.ctx.resume(); }catch(e){ console.warn('Audio context initialization failed:', e); } }, {once:true});

  // Result screen background music (use a soft beep sequence instead of YouTube)
  function playResultSong(){ 
    try{ 
      const ctx=Audio.ctx||new (window.AudioContext||window.webkitAudioContext)(); 
      const now=ctx.currentTime; 
      [0,0.2,0.4].forEach((d,i)=>{ 
        const o=ctx.createOscillator(); 
        const g=ctx.createGain(); 
        o.type='sine'; 
        o.frequency.value=440 + i*60; 
        g.gain.value=0.0001; 
        o.connect(g); 
        g.connect(ctx.destination); 
        o.start(now+d); 
        g.gain.exponentialRampToValueAtTime(0.15, now+d+0.02); 
        g.gain.exponentialRampToValueAtTime(0.0001, now+d+0.15); 
        o.stop(now+d+0.16); 
      }); 
    } catch(e){ 
      console.warn('Failed to play result song:', e); 
    } 
  }
  function stopResultSong(){}

  // Screens
  const Screens={cur:'screen-main', go(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); this.cur=id; if(id==='screen-select') UI.loadSongs(); if(id==='screen-community') UI.loadCommunity(); if(id==='screen-profile') UI.loadProfile(); if(id==='screen-options') UI.loadOptions(); }}; document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>Screens.go(b.getAttribute('data-nav'))));

  // Game
  const gC=$('#gameCanvas'), g= gC.getContext('2d');
  const Game={running:false, paused:false, notes:[], hitIdx:0, score:0, combo:0, maxCombo:0, judge:{perfect:0,great:0,good:0,miss:0}, offset:0, speed:600, startMs:0, lastMs:0, mods:{speed:1,mirror:false,fadeIn:false}, pressed:{1:false,2:false,3:false,4:false}, health:1,
    resize(){ const area=$('#gameArea'); if(!area) return; const r=area.getBoundingClientRect(); gC.width=r.width; gC.height=r.height; this.judgeY=gC.height-80; this.lanes=[0,1,2,3].map(i=>({x:i*(r.width/4),w:(r.width/4)})); },
         async start(chart,mods){ 
       console.log('Starting game with chart:', chart);
       this.chart=JSON.parse(JSON.stringify(chart)); 
       this.notes=this.chart.notes.slice().sort((a,b)=>a.time-b.time); 
       console.log('Initial notes count:', this.notes.length);
       this.hitIdx=0; this.score=0; this.combo=0; this.maxCombo=0; 
       this.judge={perfect:0,great:0,good:0,miss:0}; this.health=1; 
       this.offset=chart.offset||0; 
       const o=Options.get(); 
       this.mods={speed:1,mirror:o.mirror,fadeIn:o.fadeIn,...(mods||{})}; 
       this.speed=80*(o.speed||6)*(this.mods.speed||1); 
       
       Screens.go('screen-game'); 
       this.resize(); 
       addEventListener('resize', this._rs=()=>this.resize()); 
       this.bind();
       
               // Load audio with better error handling
        try {
          if(chart.dataUrl){ 
            await Audio.useDataUrl(chart.dataUrl); 
            console.log('Loaded audio from dataUrl');
          } else if(chart.mp3){ 
            if(chart.mp3.startsWith('data:')) {
              await Audio.useDataUrl(chart.mp3);
              console.log('Loaded audio from data URL');
            } else if(chart.mp3.startsWith('http') || chart.mp3.startsWith('/')) {
              // Handle both full URLs and server paths
              const mp3Url = chart.mp3.startsWith('/') ? `${SERVER_URL}${chart.mp3}` : chart.mp3;
              console.log('Loading MP3 from:', mp3Url);
              
              // Try to fetch remote MP3 and convert to data URL
              const response = await fetch(mp3Url);
              if(response.ok) {
                const blob = await response.blob();
                const dataUrl = await fileToDataURL(blob);
                await Audio.useDataUrl(dataUrl);
                console.log('MP3 loaded successfully from server');
              } else {
                throw new Error(`Failed to fetch remote MP3: ${response.status} ${response.statusText}`);
              }
            } else {
              // Local file path - try to load from local files
              try {
                const response = await fetch(chart.mp3);
                if(response.ok) {
                  const blob = await response.blob();
                  const dataUrl = await fileToDataURL(blob);
                  await Audio.useDataUrl(dataUrl);
                  console.log('Loaded audio from local file path');
                } else {
                  throw new Error('Failed to load local MP3 file');
                }
              } catch(localError) {
                console.warn('Failed to load local MP3:', localError);
                throw localError;
              }
            }
          } else { 
            console.log('No audio found in chart');
            Audio.mode='none'; 
          }
          
          // Load chart data from JSON file if specified
          if(chart.chartFile) {
            try {
              const chartResponse = await fetch(chart.chartFile);
              if(chartResponse.ok) {
                const chartData = await chartResponse.json();
                this.chart.notes = chartData.notes || [];
                this.notes = this.chart.notes.slice().sort((a,b)=>a.time-b.time);
                console.log(`Loaded chart data from ${chart.chartFile}: ${this.notes.length} notes`);
              } else {
                console.warn(`Failed to load chart file: ${chartResponse.status}`);
              }
            } catch(chartError) {
              console.warn('Failed to load chart data:', chartError);
            }
          }
          
          // Load YouTube video if specified
          if(chart.youtube) {
            await Audio.useYouTube(chart.youtube);
            console.log('Loaded YouTube video background');
          }
        } catch(audioError) {
          console.warn('Audio loading failed:', audioError);
          Audio.mode='none';
        }
       
       await this.primePlayback(); 
       await this.countdown(); 
       this.startMs=performance.now(); 
       this.lastMs=this.startMs; 
       this.audioStartTime=Audio.time(); 
       await Audio.play(); 
       this.running=true; 
       requestAnimationFrame(t=>this.frame(t)); 
     },

    async primePlayback(){
      try{
        if(Audio.mode==='mp3'){
          console.log('Priming audio playback...');
          await Audio.play(); 
          Audio.pause(); 
          Audio.seek(0);
          console.log('Audio primed successfully');
        } else {
          console.log('Audio mode is not mp3:', Audio.mode);
        }
      }catch(e){
        console.warn('Failed to prime audio:', e);
      }
    },
    async countdown(){ const el=$('#countdown'); for(const s of ['3','2','1','GO!']){ el.textContent=s; el.classList.add('flash'); await new Promise(r=>setTimeout(r, s==='GO!'?400:600)); el.classList.remove('flash'); } el.textContent=''; },
    bind(){ if(this._keys) return; this._keys=(e)=>{ const lane=KEY_TO_LANE[e.key.toLowerCase()]; if(!lane) return; if(e.type==='keydown'){ if(!this.pressed[lane]){ this.pressed[lane]=true; laneFlash(lane,true); this.hit(lane);} } else { this.pressed[lane]=false; laneFlash(lane,false);} }; addEventListener('keydown',this._keys); addEventListener('keyup',this._keys); $('#pauseBtn').onclick=()=>this.pause(); $('#resumeBtn').onclick=()=>this.resume(); $('#restartBtn').onclick=()=>{ stopResultSong(); this.restart(); }; $('#quitBtn').onclick=()=>{ stopResultSong(); this.quit(); }; $('#resultRetry').onclick=()=>{ stopResultSong(); this.restart(); }; $('#resultToSelect').onclick=()=>{ stopResultSong(); this.stop(); Screens.go('screen-select'); }; 
      
      // Add debug button to gameplay screen
      const debugBtn = document.createElement('button');
      debugBtn.id = 'gameDebug';
      debugBtn.className = 'btn';
      debugBtn.textContent = 'Debug Audio';
      debugBtn.style.position = 'fixed';
      debugBtn.style.top = '10px';
      debugBtn.style.right = '10px';
      debugBtn.style.zIndex = '1000';
      debugBtn.onclick = () => this.debugAudio();
      document.body.appendChild(debugBtn);
    },
    pause(){ if(!this.running||this.paused) return; this.paused=true; Audio.pause(); $('#pauseMenu').classList.remove('hidden'); },
    resume(){ if(!this.paused) return; this.paused=false; Audio.play(); $('#pauseMenu').classList.add('hidden'); requestAnimationFrame(t=>{ this.lastMs=t; this.frame(t);}); },
    restart(){ 
      const c=this.chart, m=this.mods; 
      this.stop(); 
      setTimeout(() => this.start(c,m), 100); // Add delay to ensure proper cleanup before restart
    },
    quit(){ this.stop(); Screens.go('screen-select'); },
    stop(){ 
    this.running=false; 
    try{ 
      removeEventListener('resize',this._rs);
    } catch(e){ 
      console.warn('Failed to remove resize event listener:', e); 
    } 
    if(this._keys){ 
      removeEventListener('keydown',this._keys); 
      removeEventListener('keyup',this._keys); 
      this._keys=null;
    } 
    Audio.pause(); 
    $('#pauseMenu').classList.add('hidden'); 
    $('#resultMenu').classList.add('hidden'); 
    [1,2,3,4].forEach(l=>laneFlash(l,false)); 
    
    // Remove debug button
    const debugBtn = document.getElementById('gameDebug');
    if(debugBtn) {
      document.body.removeChild(debugBtn);
    }
    
    // Clean up YouTube video if present
    if(Audio.yt) {
      document.body.removeChild(Audio.yt);
      Audio.yt = null;
      console.log('YouTube video cleaned up');
    }
  },
    frame(ts){
      if(!this.running) return;
      const w=gC.width,h=gC.height;
      g.clearRect(0,0,w,h);
      for(let i=0;i<4;i++){ const ln=this.lanes[i]; g.fillStyle=i%2?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.03)'; g.fillRect(ln.x,0,ln.w,h);} 
      g.fillStyle='rgba(0,229,255,0.5)'; g.fillRect(0,this.judgeY-3,w,6);
      const t=this.time(); const travel=this.speed; const r=Math.max(12,w/4*0.09);
      for(let i=this.hitIdx;i<this.notes.length;i++){
        const n=this.notes[i]; if(n.hit) continue; const lane=this.mods.mirror?5-n.lane:n.lane; const ln=this.lanes[lane-1];
        const delta=(t+this.offset)-n.time; // >0 if passed judge time
        if(delta> JUDGE_MS.miss/1000){ n.hit=true; n.judge='miss'; this.onJudge('miss'); this.hitIdx=i+1; continue; }
        const timeUntil = n.time - (t + this.offset);
        const y = this.judgeY - timeUntil * travel;
        if(y < -60 || y > h + 60) continue; // offscreen but not yet miss
        const a=this.mods.fadeIn?clamp(1 - (timeUntil*2),0.2,1):1;
        g.beginPath(); g.fillStyle=`rgba(120,255,255,${0.9*a})`;
        const cx=ln.x+ln.w/2; g.arc(cx,y,r,0,Math.PI*2); g.fill();
        g.fillStyle=`rgba(255,255,255,${0.7*a})`; g.font=`${Math.floor(r)}px Orbitron, monospace`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(LANE_TO_KEY[lane],cx,y);
      }
      const last=(this.notes[this.notes.length-1]?.time||0)+2; if(t>=last){ this.finish(); return; }
      requestAnimationFrame(t=>this.frame(t));
    },
         time(){ if(Audio.mode==='none') return (performance.now()-this.startMs)/1000; return Audio.time()-this.audioStartTime; },
    hit(lane){ const t=this.time()+this.offset; let best=-1, bd=1e9; for(let i=this.hitIdx;i<this.notes.length;i++){ const n=this.notes[i]; const ln=this.mods.mirror?5-n.lane:n.lane; if(ln!==lane) continue; const dt=Math.abs(n.time-t); if(dt<bd){bd=dt;best=i;} if(n.time>t+JUDGE_MS.miss/1000) break;} if(best<0) return; const dms=bd*1000; let j='miss'; if(dms<=JUDGE_MS.perfect) j='perfect'; else if(dms<=JUDGE_MS.great) j='great'; else if(dms<=JUDGE_MS.good) j='good'; else j='miss'; if(j==='miss') return; const n=this.notes[best]; n.hit=true;n.judge=j;n.hitTime=t; this.hitIdx=Math.max(this.hitIdx,best+1); this.onJudge(j); playHit(); },
    onJudge(j){ 
      this.judge[j]++; 
      const mult=this.combo>=25?1.02:1; 
      this.score+=Math.round(SCORE[j]*mult); 
      if(j==='miss'||j==='good') this.combo=0; 
      else this.combo++; 
      this.maxCombo=Math.max(this.maxCombo,this.combo); 
      bg.setCombo(this.combo); 
      
      if(Options.get().health){ 
        if(j==='miss') this.health=Math.max(0,(this.health||1)-0.12); 
        else if(j==='good') this.health=Math.max(0,(this.health||1)-0.04); 
        else this.health=Math.min(1,(this.health||1)+0.02);
      } 
      
      this.updateHud(); 
      
      // Check if health is depleted and show failure screen
      if(Options.get().health && (this.health||1)<=0) {
        // Slow down audio playback to indicate failure
        if(Audio.mode === 'mp3' && Audio.el) {
          Audio.el.playbackRate = 0.5;
          setTimeout(() => {
            Audio.pause();
            this.finish(true);
          }, 1000);
        } else {
          this.finish(true);
        }
      }
    },
    updateHud(){ const tj=this.judge.perfect+this.judge.great+this.judge.good+this.judge.miss; const acc=tj?((this.judge.perfect*ACC.perfect+this.judge.great*ACC.great+this.judge.good*ACC.good)/tj):1; $('#hudScore').textContent=fmtScore(this.score); $('#hudAcc').textContent=fmtPct(acc); $('#hudCombo').textContent=this.combo+'x'; $('#healthFill').style.transform=`scaleY(${this.health||1})`; },
    
    // Debug function to check audio status during gameplay
    debugAudio() {
      const status = [];
      status.push(`Chart: ${this.chart.title || 'Untitled'}`);
      status.push(`MP3: ${this.chart.mp3 ? 'Yes' : 'No'}`);
      if(this.chart.mp3) {
        if(this.chart.mp3.startsWith('data:')) {
          status.push('MP3 Type: Data URL');
          status.push(`MP3 Size: ~${Math.round(this.chart.mp3.length * 0.75 / 1024)}KB`);
        } else if(this.chart.mp3.startsWith('http') || this.chart.mp3.startsWith('/')) {
          status.push('MP3 Type: Server URL');
          status.push(`MP3 URL: ${this.chart.mp3}`);
        } else {
          status.push('MP3 Type: Local Path');
          status.push(`MP3 Path: ${this.chart.mp3}`);
        }
      }
      status.push(`Notes: ${this.chart.notes.length}`);
      status.push(`Audio Mode: ${Audio.mode}`);
      status.push(`Audio Ready: ${Audio.el && Audio.el.readyState >= 1 ? 'Yes' : 'No'}`);
      status.push(`Audio Current Time: ${Audio.time()}`);
      status.push(`Audio Duration: ${Audio.el ? Audio.el.duration : 'Unknown'}`);
      
      alert('Game Audio Debug Info:\n' + status.join('\n'));
    },
    finish(failed){
      this.running=false;
      const tj=this.judge.perfect+this.judge.great+this.judge.good+this.judge.miss;
      const acc=tj?((this.judge.perfect*ACC.perfect+this.judge.great*ACC.great+this.judge.good*ACC.good)/tj):1;
      const rank=acc>=0.95?'S':acc>=0.9?'A':acc>=0.8?'B':acc>=0.7?'C':'D';
      const p=Profile.get(); p.plays=(p.plays||0)+1; p.bestAcc=Math.max(p.bestAcc||0,acc);
      const xp=Math.round(this.score/100+acc*200); p.xp=(p.xp||0)+xp; while(p.xp>=p.level*300){ p.xp-=p.level*300; p.level++; }
      if(p.level>=3 && !(p.unlocks.themes||[]).includes('ice')) (p.unlocks.themes||[]).push('ice');
      if(p.level>=5 && !(p.unlocks.themes||[]).includes('sunset')) (p.unlocks.themes||[]).push('sunset');
      if(p.level>=7 && !(p.unlocks.themes||[]).includes('mono')) (p.unlocks.themes||[]).push('mono');
      Profile.set(p);
      Boards.put(this.chart.id,{username:p.username||'Guest',score:this.score,acc,rank,time:Date.now()});
      const lb=Boards.get(this.chart.id).slice(0,10);
      const res=$('#resultStats');
      const xpPercent=((p.xp)/(p.level*300))*100;
      res.innerHTML = `
        <div class="results-wrap">
          <div>
            <div class="rank-badge">${rank}</div>
            <div class="xp-wrap">
              <div class="xp-bar"><div class="xp-fill" style="width:${clamp(xpPercent,0,100)}%"></div></div>
              <div class="xp-label"><span>Lv. ${p.level}</span><span>+${xp} XP</span></div>
            </div>
          </div>
          <div>
            <div class="result-head">
              <div class="result-title">${this.chart.title}</div>
              <div class="result-sub">${this.chart.artist} • ${this.chart.difficulty} • ${failed?'Failed':'Clear'}</div>
            </div>
            <div class="stats-grid">
              <div class="stat"><div class="label">Score</div><div class="value">${fmtScore(this.score)}</div></div>
              <div class="stat"><div class="label">Accuracy</div><div class="value">${fmtPct(acc)}</div></div>
              <div class="stat"><div class="label">Max Combo</div><div class="value">${this.maxCombo}x</div></div>
            </div>
            <div class="judges">
              <div class="judge-pill">Perfect ${this.judge.perfect}</div>
              <div class="judge-pill">Great ${this.judge.great}</div>
              <div class="judge-pill">Good ${this.judge.good}</div>
              <div class="judge-pill">Miss ${this.judge.miss}</div>
            </div>
            <div class="lb">
              <h3>Leaderboard</h3>
              ${lb.map((e,i)=>`<div class="lb-item"><div class="lb-rank">${i+1}</div><div>${e.username}</div><div class="lb-score">${fmtScore(e.score)}</div><div>${fmtPct(e.acc)}</div><div>${e.rank}</div></div>`).join('')}
            </div>
          </div>
        </div>`;
      $('#resultMenu').classList.remove('hidden');
      playResultSong();
    }
  }; addEventListener('resize',()=>Game.resize());
  function laneFlash(l,a){ const el=document.querySelector(`.laneKey[data-lane="${l}"]`); if(!el) return; if(a) el.classList.add('active'); else el.classList.remove('active'); }
  function playHit(){ 
    try{ 
      const ctx=Audio.ctx; 
      if(!ctx) return; 
      const osc=ctx.createOscillator(); 
      const g=ctx.createGain(); 
      osc.type='square'; 
      osc.frequency.value=880; 
      g.gain.value=0.0001; 
      osc.connect(g); 
      g.connect(ctx.destination); 
      const t=ctx.currentTime; 
      osc.start(); 
      g.gain.exponentialRampToValueAtTime(Options.get().hitVolume*0.25, t+0.01); 
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.08); 
      osc.stop(t+0.1);
    } catch(e){ 
      console.warn('Failed to play hit sound:', e); 
    } 
  }

  // UI
  const UI={
    top(){ const p=Profile.get(); $('#userName').textContent=p.username||'Guest'; $('#userLevel').textContent='Lv. '+(p.level||1); },
    async loadSongs(){ 
      const q=($('#songSearch').value||'').toLowerCase(); 
      const d=$('#difficultyFilter').value||''; 
      const list=$('#songList'); 
      list.innerHTML='';
      
      try {
        const charts = await Charts.list();
        for(const c of charts.filter(c=>{
          const s=`${c.title} ${c.artist} ${c.difficulty}`.toLowerCase(); 
          return(!q||s.includes(q))&&(!d||c.difficulty===d);
        })){ 
          const card=document.createElement('div'); 
          card.className='song-card';
          card.innerHTML=`
            <img src="${c.artwork || 'https://via.placeholder.com/100x100?text=No+Artwork'}" alt="Artwork" class="song-artwork" />
            <div class="title">${c.title}</div>
            <div class="meta">${c.artist} • <span class="tag">${c.difficulty||'Normal'}</span></div>
            <div class="actions"><button class="btn primary">Play</button><button class="btn">Details</button></div>`;
          card.querySelector('.btn.primary').onclick=()=>Game.start(c);
          card.querySelectorAll('.btn')[1].onclick=()=>alert(`${c.title}\n${c.artist}\n${c.difficulty}`);
          list.appendChild(card);
        }
      } catch (e) {
        console.error('Failed to load songs:', e);
        list.innerHTML = '<div class="error">Failed to load songs</div>';
      }
    },
    async loadCommunity(){ 
      const el=$('#communityList'); 
      el.innerHTML='<div class="loading">Loading community charts...</div>';
      
      try {
        const charts = await Charts.community();
        el.innerHTML='';
        
        for(const c of charts){
          const avg=c.ratings&&c.ratings.length?(c.ratings.reduce((a,b)=>a+b,0)/c.ratings.length).toFixed(1):'—';
          const hasAudio = !!(c.mp3 || c.dataUrl);
          const card=document.createElement('div'); 
          card.className='song-card';
          card.innerHTML=`
            <div class="title">${c.title}</div>
            <div class="meta">${c.artist} • ${c.difficulty} • by ${c.author} • ${hasAudio ? 'Audio: MP3' : 'Audio: —'} • ★ ${avg}</div>
            <div class="actions"><button class="btn primary">Play</button><button class="btn">Download</button><button class="btn">Rate ★</button></div>`;
          card.querySelector('.btn.primary').onclick=()=>{ Game.start(c); };
          card.querySelectorAll('.btn')[1].onclick=()=>{ const blob=new Blob([JSON.stringify(c,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${slug(c.title)}.json`; a.click(); URL.revokeObjectURL(url); };
          card.querySelectorAll('.btn')[2].onclick=()=>{ 
            const v=Number(prompt('Rate 1-5')); 
            if(!v||v<1||v>5) return; 
            // Rate on server
            fetch(`https://wavex-7f4p.onrender.com/api/charts/${c.id}/rate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rating: v, username: Profile.get().username || 'Guest' })
            }).then(() => UI.loadCommunity()).catch(e => console.error('Rating failed:', e));
          };
          el.appendChild(card);
        }
      } catch (e) {
        console.error('Failed to load community charts:', e);
        el.innerHTML = '<div class="error">Failed to load community charts</div>';
      }
    },
    loadProfile(){ const p=Profile.get(); $('#profileName').value=p.username||''; $('#profileLevel').textContent=p.level||1; $('#profileXP').textContent=p.xp||0; $('#profilePlays').textContent=p.plays||0; $('#profileBestAcc').textContent=fmtPct(p.bestAcc||0); const un=$('#unlockGrid'); un.innerHTML=''; for(const th of ['neon','ice','sunset','mono']){ const owned=(p.unlocks?.themes||[]).includes(th); const d=document.createElement('div'); d.className='chip'; d.textContent=`Theme: ${th} ${owned?'✓':'✖'}`; un.appendChild(d);} },
    loadOptions(){ const o=Options.get(); $('#optVolume').value=o.volume; $('#optHitVolume').value=o.hitVolume; $('#optSpeed').value=o.speed; $('#optMirror').checked=o.mirror; $('#optFadeIn').checked=o.fadeIn; $('#optHealth').checked=o.health; $('#optTheme').value=o.theme; }
    };
  function hash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(Math.imul(31,h)+s.charCodeAt(i))|0; } return h; }

  // Editor
  const Editor={ playing:false, recording:false, chart:{id:'',title:'',artist:'',difficulty:'Normal',mp3:'',artwork:'',offset:0,notes:[]}, mp3:null, artwork:null, timeline:$('#timelineCanvas'), ctx:null, zoom:3, cursor:0, lastActionStack:[],
         init(){
       this.ctx=this.timeline.getContext('2d'); this.resize(); addEventListener('resize',()=>this.resize());
       $('#editorLoad').onclick=()=>this.load(); $('#editorPlay').onclick=()=>this.play(); $('#editorPause').onclick=()=>this.pause();
       $('#editorSave').onclick=()=>this.save(); $('#editorPublish').onclick=()=>this.publish();
       const saveMp3Btn=document.getElementById('editorSaveMp3'); if(saveMp3Btn) saveMp3Btn.onclick=()=>this.saveMp3Locally();
               $('#editorExport').onclick=()=>this.exportJSON(); $('#editorClear').onclick=()=>this.clearNotes(); $('#editorUndo').onclick=()=>this.undo();
        
        // Add debug button
        const debugBtn = document.createElement('button');
        debugBtn.id = 'editorDebug';
        debugBtn.className = 'btn';
        debugBtn.textContent = 'Debug Audio';
        debugBtn.onclick = () => this.debugAudio();
        
        // Insert after the Undo button
        const undoBtn = document.getElementById('editorUndo');
        if (undoBtn && undoBtn.parentNode) {
          undoBtn.parentNode.insertBefore(debugBtn, undoBtn.nextSibling);
        }
       $('#timelineZoom').oninput=(e)=>this.zoom=Number(e.target.value); $('#editorOffset').oninput=(e)=>this.chart.offset=Number(e.target.value);
       $('#mp3File').onchange=async(e)=>{ this.mp3=e.target.files[0]; if(this.mp3){ const dataUrl=await fileToDataURL(this.mp3); this.chart.mp3=dataUrl; } };
       $('#artworkFile').onchange=async(e)=>{ this.artwork=e.target.files[0]; if(this.artwork){ const dataUrl=await fileToDataURL(this.artwork); this.chart.artwork=dataUrl; } };
       $('#editorTitle').oninput=(e)=>this.chart.title=e.target.value; $('#editorArtist').oninput=(e)=>this.chart.artist=e.target.value; $('#editorDiff').oninput=(e)=>this.chart.difficulty=e.target.value;
       
       // Add import JSON functionality
       this.setupImportJSON();
      // Recording with DFJK during playback
      addEventListener('keydown',(e)=>{
        if(Screens.cur!=='screen-editor') return;
        const lane=KEY_TO_LANE[e.key.toLowerCase()];
        if(!lane){
          if(e.key==='ArrowRight') this.cursor+=e.shiftKey?0.02:0.1;
          if(e.key==='ArrowLeft') this.cursor=Math.max(0,this.cursor-(e.shiftKey?0.02:0.1));
          if(e.key==='Backspace'){ const popped=this.chart.notes.pop(); if(popped) this.lastActionStack.push({type:'del',note:popped}); }
          return;
        }
        const t=this.playing?Audio.time()+this.chart.offset:this.cursor; // timeline respects offset
        const note={time:Number(t.toFixed(3)), lane};
        this.chart.notes.push(note); this.chart.notes.sort((a,b)=>a.time-b.time);
        this.lastActionStack.push({type:'add',note});
        this.setStatus(`Added lane ${lane} @ ${note.time.toFixed(2)}s (${this.chart.notes.length})`);
      });
      this.loop();
    },
    async load(){
      try {
        if(this.chart.mp3){ await Audio.useDataUrl(this.chart.mp3); }
        else if(this.mp3){ await Audio.useMp3(this.mp3); this.chart.mp3=await fileToDataURL(this.mp3); }
        else { alert('Upload an MP3.'); return; }
        // Wait for metadata so seeking/timeline works
        await new Promise(res=>{ if(!Audio.el.readyState||Audio.el.readyState<1){ Audio.el.onloadedmetadata=()=>res(); } else res(); });
        await Audio.ensure(); Audio.setVolume(Options.get().volume);
        // Prime
        try { await Audio.el.play(); } catch(e) {}
        Audio.el.pause(); Audio.seek(0);
        this.setStatus(`Loaded audio • ${Math.round(Audio.el.duration||0)}s`);
      } catch(e) { console.warn(e); this.setStatus('Failed to load audio'); }
    },
    async play(){
      try {
        await Audio.ensure(); if(Audio.ctx.state==='suspended') await Audio.ctx.resume();
        await Audio.el.play(); this.playing=true;
        this.setStatus('Recording: press D/F/J/K to place notes');
        Audio.el.onended=()=>{ this.playing=false; this.setStatus('Ended'); };
      } catch(e) { console.warn(e); this.setStatus('Playback blocked – click anywhere then Play again'); }
    },
    pause(){ Audio.pause(); this.playing=false; this.setStatus('Paused'); },
    resize(){ this.timeline.width=this.timeline.clientWidth; this.timeline.height=this.timeline.clientHeight; },
    loop(){
      const w=this.timeline.width,h=this.timeline.height; this.ctx.clearRect(0,0,w,h);
      // guard sizes
      if(!w||!h){ requestAnimationFrame(()=>this.loop()); return; }
      const t=this.playing?Audio.time():this.cursor; const win=6/this.zoom; const st=Math.max(0,t-win/2), en=st+win; const xT=(ti)=> (ti-st)/(en-st)*w;
      // grid
      this.ctx.strokeStyle='rgba(255,255,255,0.08)'; this.ctx.beginPath();
      for(let x=0;x<w;x+=Math.max(20,w*(1/this.zoom)/10)){ this.ctx.moveTo(x,0); this.ctx.lineTo(x,h);} this.ctx.stroke();
      // notes
      for(const n of this.chart.notes){ if(n.time<st||n.time>en) continue; const x=xT(n.time); this.ctx.fillStyle='rgba(168,85,247,0.9)'; this.ctx.fillRect(x-2,0,4,h); this.ctx.fillStyle='rgba(255,255,255,0.7)'; this.ctx.fillText(LANE_TO_KEY[n.lane], x+6, 14); }
      // cursor
      const cx=xT(t); this.ctx.fillStyle='rgba(0,229,255,0.9)'; this.ctx.fillRect(cx-1,0,2,h);
      requestAnimationFrame(()=>this.loop());
    },
    save(){ if(!this.chart.title||!this.chart.artist) return alert('Title/Artist required'); this.chart.id=this.chart.id||`${slug(this.chart.title)}-${slug(this.chart.artist)}-${slug(this.chart.difficulty||'normal')}`; Charts.save(this.chart); alert('Draft saved'); },
        async publish(){
      const p=Profile.get(); if(!p.username||p.username==='Guest') return alert('Set username in Profile'); if(!this.chart.notes.length) return alert('Add notes first');
      this.chart.id=this.chart.id||`${slug(this.chart.title)}-${slug(this.chart.artist)}-${slug(this.chart.difficulty||'normal')}`;
      
      // Upload MP3 to server if we have an MP3 file/data but not a URL
      if((this.mp3 || (this.chart.mp3 && this.chart.mp3.startsWith('data:'))) && !(this.chart.mp3 && this.chart.mp3.startsWith('http'))){
        try{
          const fileName = `${slug(this.chart.title||'song')}-${Date.now()}.mp3`;
          const blob = this.mp3 ? this.mp3 : await (await fetch(this.chart.mp3)).blob();
          
          // Create form data and upload to server
          const formData = new FormData();
          formData.append('mp3', blob, fileName);
          
          const response = await fetch(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          this.chart.mp3 = result.url; // Server returns the URL to the uploaded file
          this.setStatus('MP3 uploaded successfully');
        } catch(e) { 
          console.warn('MP3 upload failed:', e); 
          alert('Failed to upload MP3: ' + (e.message || 'Unknown error')); 
          return;
        }
      }

      // Upload Artwork to server if we have an artwork file/data but not a URL
      if((this.artwork || (this.chart.artwork && this.chart.artwork.startsWith('data:'))) && !(this.chart.artwork && this.chart.artwork.startsWith('http'))){
        try{
          const fileName = `${slug(this.chart.title||'song')}-artwork-${Date.now()}.png`; // Assuming artwork is PNG
          const blob = this.artwork ? this.artwork : await (await fetch(this.chart.artwork)).blob();
          
          // Create form data and upload to server
          const formData = new FormData();
          formData.append('artwork', blob, fileName);
          
          const response = await fetch(`${SERVER_URL}/api/upload-artwork`, { // New endpoint for artwork
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Artwork upload failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          this.chart.artwork = result.url; // Server returns the URL to the uploaded file
          this.setStatus('Artwork uploaded successfully');
        } catch(e) { 
          console.warn('Artwork upload failed:', e); 
          alert('Failed to upload Artwork: ' + (e.message || 'Unknown error')); 
          return;
        }
      }
      
      // Store chart in local community charts
      const published = await Charts.publish(this.chart, p.username);
      if (published) {
        this.setStatus('Chart published to server!');
        alert('Chart published successfully to server!');
      } else {
        this.setStatus('Chart saved locally (server failed)');
        alert('Chart saved locally but server upload failed');
      }
    },
    saveMp3Locally(){
      try{
        if(!this.mp3 && !this.chart.mp3){ alert('Load an MP3 first.'); return; }
        if(this.mp3){
          const a=document.createElement('a'); a.href=URL.createObjectURL(this.mp3);
          a.download = `${slug(this.chart.title||'song')}.mp3`; a.click();
          URL.revokeObjectURL(a.href);
        } else if(this.chart.mp3 && this.chart.mp3.startsWith('data:')) {
          const a=document.createElement('a'); a.href=this.chart.mp3; a.download=`${slug(this.chart.title||'song')}.mp3`; a.click();
        } else if (this.chart.mp3) {
          window.open(this.chart.mp3, '_blank');
        }
        this.setStatus('MP3 saved locally.');
      }catch(e){ console.warn('Failed to save MP3:', e); alert('Failed to save MP3: ' + e.message); }
    },
         exportJSON(){ const blob=new Blob([JSON.stringify(this.chart,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${slug(this.chart.title||'chart')}.json`; a.click(); URL.revokeObjectURL(url); },
     
     // Debug function to check chart audio status
     debugAudio() {
       const status = [];
       status.push(`Chart: ${this.chart.title || 'Untitled'}`);
       status.push(`MP3: ${this.chart.mp3 ? 'Yes' : 'No'}`);
       if(this.chart.mp3) {
         if(this.chart.mp3.startsWith('data:')) {
           status.push('MP3 Type: Data URL');
           status.push(`MP3 Size: ~${Math.round(this.chart.mp3.length * 0.75 / 1024)}KB`);
         } else if(this.chart.mp3.startsWith('http')) {
           status.push('MP3 Type: HTTP URL');
           status.push(`MP3 URL: ${this.chart.mp3}`);
         } else {
           status.push('MP3 Type: Local Path');
           status.push(`MP3 Path: ${this.chart.mp3}`);
         }
       }
       status.push(`Notes: ${this.chart.notes.length}`);
       status.push(`Audio Mode: ${Audio.mode}`);
       status.push(`Audio Ready: ${Audio.el && Audio.el.readyState >= 1 ? 'Yes' : 'No'}`);
       
       alert('Audio Debug Info:\n' + status.join('\n'));
     },
    clearNotes(){ if(confirm('Clear all notes?')){ this.chart.notes=[]; this.setStatus('Cleared notes'); } },
    undo(){ const last=this.lastActionStack.pop(); if(!last) return; if(last.type==='add'){ const idx=this.chart.notes.lastIndexOf(last.note); if(idx>=0) this.chart.notes.splice(idx,1); } if(last.type==='del'){ this.chart.notes.push(last.note); this.chart.notes.sort((a,b)=>a.time-b.time); } this.setStatus('Undid last action'); },
    setStatus(t){ const el=document.getElementById('editorStatus'); if(el) el.textContent=t; },
    
    // Import JSON functionality
    setupImportJSON() {
      // Create import button if it doesn't exist
      if (!document.getElementById('editorImport')) {
        const importBtn = document.createElement('button');
        importBtn.id = 'editorImport';
        importBtn.className = 'btn';
        importBtn.textContent = 'Import JSON';
        importBtn.onclick = () => this.importJSON();
        
        // Insert after the Export button
        const exportBtn = document.getElementById('editorExport');
        if (exportBtn && exportBtn.parentNode) {
          exportBtn.parentNode.insertBefore(importBtn, exportBtn.nextSibling);
        }
      }
      
      // Add drag and drop support for JSON files
      this.setupDragAndDrop();
    },
    
    setupDragAndDrop() {
      const editorArea = document.getElementById('editorArea');
      if (!editorArea) return;
      
      editorArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        editorArea.style.borderColor = 'var(--neon1)';
        editorArea.style.boxShadow = '0 0 20px rgba(0,229,255,0.3)';
      });
      
      editorArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        editorArea.style.borderColor = '';
        editorArea.style.boxShadow = '';
      });
      
      editorArea.addEventListener('drop', (e) => {
        e.preventDefault();
        editorArea.style.borderColor = '';
        editorArea.style.boxShadow = '';
        
        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(file => file.name.endsWith('.json'));
        
        if (jsonFile) {
          this.importJSONFile(jsonFile);
        } else {
          alert('Please drop a JSON chart file (.json)');
        }
      });
    },
    
    importJSON() {
      // Create file input for JSON
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        this.importJSONFile(file);
        
        // Clean up
        document.body.removeChild(input);
      };
      
      // Trigger file selection
      document.body.appendChild(input);
      input.click();
    },
    
         async importJSONFile(file) {
       try {
         const text = await file.text();
         const chartData = JSON.parse(text);
         
         // Validate chart data
         if (!chartData.title || !chartData.artist || !Array.isArray(chartData.notes)) {
           throw new Error('Invalid chart format. Must have title, artist, and notes array.');
         }
         
         // Load the chart data
         this.chart = {
           id: chartData.id || '',
           title: chartData.title,
           artist: chartData.artist,
           difficulty: chartData.difficulty || 'Normal',
           mp3: chartData.mp3 || '',
           artwork: chartData.artwork || '',
           offset: chartData.offset || 0,
           notes: chartData.notes || []
         };
         
         // Update form fields
         $('#editorTitle').value = this.chart.title;
         $('#editorArtist').value = this.chart.artist;
         $('#editorDiff').value = this.chart.difficulty;
         $('#editorOffset').value = this.chart.offset;
         
         // Try to load MP3 if it exists
         if (this.chart.mp3) {
           try {
             if (this.chart.mp3.startsWith('data:')) {
               // Data URL - load directly
               await Audio.useDataUrl(this.chart.mp3);
               this.setStatus(`Imported: ${this.chart.title} by ${this.chart.artist} (${this.chart.notes.length} notes) • MP3 loaded`);
             } else if (this.chart.mp3.startsWith('http')) {
               // HTTP URL - try to fetch and convert to data URL
               const response = await fetch(this.chart.mp3);
               if (response.ok) {
                 const blob = await response.blob();
                 const dataUrl = await fileToDataURL(blob);
                 this.chart.mp3 = dataUrl;
                 await Audio.useDataUrl(dataUrl);
                 this.setStatus(`Imported: ${this.chart.title} by ${this.chart.artist} (${this.chart.notes.length} notes) • MP3 loaded from URL`);
               } else {
                 this.setStatus(`Imported: ${this.chart.title} by ${this.chart.artist} (${this.chart.notes.length} notes) • MP3 URL failed to load`);
               }
             } else {
               // Local file path - try to load
               this.setStatus(`Imported: ${this.chart.title} by ${this.chart.artist} (${this.chart.notes.length} notes) • MP3 path: ${this.chart.mp3}`);
             }
           } catch (mp3Error) {
             console.warn('Failed to load MP3 during import:', mp3Error);
             this.setStatus(`Imported: ${this.chart.title} by ${this.chart.artist} (${this.chart.notes.length} notes) • MP3 load failed`);
           }
         } else {
           this.setStatus(`Imported: ${this.chart.title} by ${this.chart.artist} (${this.chart.notes.length} notes) • No MP3`);
         }
         
         // Clear action stack since this is a new chart
         this.lastActionStack = [];
         
       } catch (error) {
         console.error('Import failed:', error);
         alert(`Failed to import chart: ${error.message}`);
       }
     }
  };

     // Wiring
   function wire(){ UI.top(); $('#songSearch').oninput=()=>UI.loadSongs(); $('#difficultyFilter').onchange=()=>UI.loadSongs(); $('#refreshCommunity').onclick=()=>UI.loadCommunity(); $('#profileName').onchange=(e)=>{ const p=Profile.get(); p.username=e.target.value; Profile.set(p); UI.top(); }; $('#profileAvatar').onchange=async(e)=>{ const f=e.target.files[0]; if(!f) return; const url=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); }); const p=Profile.get(); p.avatar=url; Profile.set(p); UI.top(); }; ['optVolume','optHitVolume','optSpeed','optMirror','optFadeIn','optHealth','optTheme'].forEach(id=>{ const el=$('#'+id); const save=()=>{ const o=Options.get(); o.volume=Number($('#optVolume').value); o.hitVolume=Number($('#optHitVolume').value); o.speed=Number($('#optSpeed').value); o.mirror=$('#optMirror').checked; o.fadeIn=$('#optFadeIn').checked; o.health=$('#optHealth').checked; o.theme=$('#optTheme').value; Options.set(o); }; el.addEventListener(el.type==='checkbox'?'change':'input',save); }); Editor.init(); }

   // Admin Panel Functions - Made globally accessible
   window.showAdminLogin = function() {
     const modal = document.getElementById('adminModal');
     const login = document.getElementById('adminLogin');
     const dashboard = document.getElementById('adminDashboard');
     
     modal.classList.remove('hidden');
     login.classList.remove('hidden');
     dashboard.classList.add('hidden');
   };

   window.hideAdminPanel = function() {
     document.getElementById('adminModal').classList.add('hidden');
   };

   window.adminLogin = async function() {
     const password = document.getElementById('adminPassword').value;
     const errorDiv = document.getElementById('adminError');
     
     try {
       const response = await fetch('https://wavex-7f4p.onrender.com/api/admin/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ password })
       });
       
       const data = await response.json();
       
       if (data.success) {
         // Store session token
         localStorage.setItem('adminSessionToken', data.sessionToken);
         
         // Show dashboard
         document.getElementById('adminLogin').classList.add('hidden');
         document.getElementById('adminDashboard').classList.remove('hidden');
         
         // Load songs
         loadAdminSongs();
       } else {
         errorDiv.textContent = data.error || 'Login failed';
         errorDiv.classList.remove('hidden');
       }
     } catch (error) {
       errorDiv.textContent = 'Connection failed: ' + error.message;
       errorDiv.classList.remove('hidden');
     }
   };

   async function loadAdminSongs() {
     const sessionToken = localStorage.getItem('adminSessionToken');
     if (!sessionToken) return;
     
     try {
       const response = await fetch('https://wavex-7f4p.onrender.com/api/admin/songs', {
         headers: { 'x-admin-session': sessionToken }
       });
       
       if (response.ok) {
         const songs = await response.json();
         displayAdminSongs(songs);
       } else {
         console.error('Failed to load admin songs');
       }
     } catch (error) {
       console.error('Admin songs error:', error);
     }
   }

   function displayAdminSongs(songs) {
     const list = document.getElementById('adminSongsList');
     
     if (songs.length === 0) {
       list.innerHTML = '<div class="no-songs">No songs uploaded yet</div>';
       return;
     }
     
     list.innerHTML = songs.map(song => `
       <div class="admin-song-item">
         <div class="song-info">
           <div class="filename">${song.filename}</div>
           <div class="meta">${song.type.toUpperCase()} • ${formatFileSize(song.size)} • ${new Date(song.uploadDate).toLocaleDateString()}</div>
         </div>
         <button class="btn danger" onclick="deleteSong('${song.filename}')">Delete</button>
       </div>
     `).join('');
   }

   function formatFileSize(bytes) {
     if (bytes === 0) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
   }

   window.deleteSong = async function(filename) {
     if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
     
     const sessionToken = localStorage.getItem('adminSessionToken');
     if (!sessionToken) return;
     
     try {
       const response = await fetch(`https://wavex-7f4p.onrender.com/api/admin/songs/${encodeURIComponent(filename)}`, {
         method: 'DELETE',
         headers: { 'x-admin-session': sessionToken }
       });
       
       if (response.ok) {
         alert('Song deleted successfully!');
         loadAdminSongs(); // Refresh the list
       } else {
         alert('Failed to delete song');
       }
     } catch (error) {
       alert('Error deleting song: ' + error.message);
     }
   };

   window.refreshAdminSongs = function() {
     loadAdminSongs();
   };

   // Search functionality for admin panel
   document.addEventListener('DOMContentLoaded', function() {
     const searchInput = document.getElementById('adminSearch');
     if (searchInput) {
       searchInput.addEventListener('input', function() {
         const query = this.value.toLowerCase();
         const songItems = document.querySelectorAll('.admin-song-item');
         
         songItems.forEach(item => {
           const filename = item.querySelector('.filename').textContent.toLowerCase();
           if (filename.includes(query)) {
             item.style.display = 'block';
           } else {
             item.style.display = 'none';
           }
         });
       });
     }
   });

  // Admin Panel Functions - Made globally accessible
  window.showAdminLogin = function() {
    const modal = document.getElementById('adminModal');
    const login = document.getElementById('adminLogin');
    const dashboard = document.getElementById('adminDashboard');
    
    modal.classList.remove('hidden');
    login.classList.remove('hidden');
    dashboard.classList.add('hidden');
  };

  window.hideAdminPanel = function() {
    document.getElementById('adminModal').classList.add('hidden');
  };

  window.adminLogin = async function() {
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminError');
    
    try {
      const response = await fetch('https://wavex-7f4p.onrender.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store session token
        localStorage.setItem('adminSessionToken', data.sessionToken);
        
        // Show dashboard
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        
        // Load songs
        loadAdminSongs();
      } else {
        errorDiv.textContent = data.error || 'Login failed';
        errorDiv.classList.remove('hidden');
      }
    } catch (error) {
      errorDiv.textContent = 'Connection failed: ' + error.message;
      errorDiv.classList.remove('hidden');
    }
  };

  async function loadAdminSongs() {
    const sessionToken = localStorage.getItem('adminSessionToken');
    if (!sessionToken) return;
    
    try {
      const response = await fetch('https://wavex-7f4p.onrender.com/api/admin/songs', {
        headers: { 'x-admin-session': sessionToken }
      });
      
      if (response.ok) {
        const songs = await response.json();
        displayAdminSongs(songs);
      } else {
        console.error('Failed to load admin songs');
      }
    } catch (error) {
      console.error('Admin songs error:', error);
    }
  }

  function displayAdminSongs(songs) {
    const list = document.getElementById('adminSongsList');
    
    if (songs.length === 0) {
      list.innerHTML = '<div class="no-songs">No songs uploaded yet</div>';
      return;
    }
    
    list.innerHTML = songs.map(song => `
      <div class="admin-song-item">
        <div class="song-info">
          <div class="filename">${song.filename}</div>
          <div class="meta">${song.type.toUpperCase()} • ${formatFileSize(song.size)} • ${new Date(song.uploadDate).toLocaleDateString()}</div>
        </div>
        <button class="btn danger" onclick="deleteSong('${song.filename}')">Delete</button>
      </div>
    `).join('');
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  window.deleteSong = async function(filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
    
    const sessionToken = localStorage.getItem('adminSessionToken');
    if (!sessionToken) return;
    
    try {
      const response = await fetch(`https://wavex-7f4p.onrender.com/api/admin/songs/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'x-admin-session': sessionToken }
      });
      
      if (response.ok) {
        alert('Song deleted successfully!');
        loadAdminSongs(); // Refresh the list
      } else {
        alert('Failed to delete song');
      }
    } catch (error) {
      alert('Error deleting song: ' + error.message);
    }
  };

  window.refreshAdminSongs = function() {
    loadAdminSongs();
  };

  // Search functionality for admin panel
  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const songItems = document.querySelectorAll('.admin-song-item');
        
        songItems.forEach(item => {
          const filename = item.querySelector('.filename').textContent.toLowerCase();
          if (filename.includes(query)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }
  });

function init(){ Options.set(Options.get()); wire(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


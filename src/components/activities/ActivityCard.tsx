import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isIOS } from '@/utils/platformDetection';

interface ActivityCardProps {
  title: string;
  link: string;
  isYouTube: boolean;
  videoId?: string;
  thumbnailUrl?: string;
  activityDate?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
  subActivityName?: string;
  iframeCode?: string;
  activityId?: string;
  canEdit?: boolean;
  audioUrl?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  link,
  isYouTube,
  videoId,
  thumbnailUrl,
  activityDate,
  showEditButton = false,
  onEdit,
  subActivityName,
  iframeCode,
  activityId,
  canEdit = false,
  audioUrl
}) => {
  const getDisplayImage = () => {
    if (thumbnailUrl) {
      return thumbnailUrl;
    }
    
    // Si on a un code iframe, extraire l'ID de la vidéo depuis le code
    if (iframeCode) {
      const srcMatch = iframeCode.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"?]+)/);
      if (srcMatch && srcMatch[1]) {
        return `https://img.youtube.com/vi/${srcMatch[1]}/maxresdefault.jpg`;
      }
    }
    
    // Si on a un videoId directement fourni
    if (isYouTube && videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    // Fallback sur l'image par défaut
    return '/placeholder.svg';
  };

  const handleClick = () => {
    if (iframeCode) {
      try {
        // Essayer de parser le JSON pour les jeux
        const gameData = JSON.parse(iframeCode);
        
        if (gameData.type === 'music_quiz') {
          // Gestion spéciale pour les quiz musicaux
          const isiOSDevice = isIOS();
          
          // Sur iOS, vérifier si on a de l'audio disponible
          if (isiOSDevice && !audioUrl && !gameData.questions.some((q: any) => q.audioUrl)) {
            alert('Ce quiz musical n\'est pas compatible avec votre appareil iOS. Veuillez demander à l\'administrateur d\'ajouter des fichiers audio.');
            return;
          }
          
          // Ouvrir le quiz musical avec logique adaptée
          const newWindow = window.open('', '_blank', 'width=1200,height=800');
          if (newWindow) {
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${title}</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      margin: 0; 
                      padding: 0; 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      min-height: 100vh;
                      color: white;
                    }
                    .quiz-container {
                      padding: 20px;
                      max-width: 800px;
                      margin: 0 auto;
                      min-height: 100vh;
                      display: flex;
                      flex-direction: column;
                    }
                    .header {
                      text-align: center;
                      margin-bottom: 30px;
                    }
                    .header h1 {
                      color: white;
                      margin: 0 0 10px 0;
                      font-size: 2.5rem;
                      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    }
                    .score-info {
                      background: rgba(255,255,255,0.1);
                      padding: 15px;
                      border-radius: 10px;
                      text-align: center;
                      margin-bottom: 20px;
                      backdrop-filter: blur(10px);
                    }
                    .question-container {
                      background: rgba(255,255,255,0.95);
                      border-radius: 15px;
                      padding: 30px;
                      margin-bottom: 20px;
                      color: #333;
                      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }
                    .audio-container {
                      margin-bottom: 30px;
                      text-align: center;
                      position: relative;
                    }
                    .audio-player {
                      width: 100%;
                      max-width: 500px;
                      margin: 0 auto;
                      background: #f8f9fa;
                      border-radius: 10px;
                      padding: 20px;
                    }
                    .video-container {
                      margin-bottom: 30px;
                      text-align: center;
                      position: relative;
                    }
                    #player {
                      border-radius: 10px;
                      max-width: 100%;
                      height: 315px;
                      width: 560px;
                      margin: 0 auto;
                    }
                    @media (max-width: 600px) {
                      #player {
                        width: 100%;
                        height: 250px;
                      }
                    }
                    .instruction {
                      background: rgba(59, 130, 246, 0.1);
                      border: 1px solid rgba(59, 130, 246, 0.3);
                      border-radius: 8px;
                      padding: 15px;
                      margin-bottom: 20px;
                      color: #1e40af;
                      font-weight: 500;
                      text-align: center;
                      font-size: 1rem;
                    }
                     .question {
                       font-size: 1.5rem;
                       font-weight: 600;
                       margin-bottom: 25px;
                       text-align: center;
                       color: #2d3748;
                     }
                     .artist-title {
                       font-size: 1.1rem;
                       font-weight: 500;
                       color: #4a5568;
                       text-align: center;
                       margin-bottom: 20px;
                       padding: 10px;
                       background: rgba(255,255,255,0.8);
                       border-radius: 8px;
                       border-left: 4px solid #667eea;
                     }
                     @media (max-width: 768px) {
                       .question {
                         font-size: 1.1rem;
                       }
                       .artist-title {
                         font-size: 0.95rem;
                       }
                     }
                    .answers {
                      display: flex;
                      flex-direction: column;
                      gap: 15px;
                    }
                    .answer-btn {
                      padding: 15px 20px;
                      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                      color: white;
                      border: none;
                      border-radius: 10px;
                      cursor: pointer;
                      font-size: 1.1rem;
                      font-weight: 500;
                      transition: all 0.3s ease;
                      transform: translateY(0);
                    }
                    .answer-btn:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
                    }
                    .answer-btn.correct {
                      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
                      animation: correctAnswer 0.6s ease;
                    }
                    .answer-btn.incorrect {
                      background: linear-gradient(135deg, #ff7979 0%, #f093fb 100%);
                      animation: incorrectAnswer 0.6s ease;
                    }
                    @keyframes correctAnswer {
                      0% { transform: scale(1); }
                      50% { transform: scale(1.05); }
                      100% { transform: scale(1); }
                    }
                    @keyframes incorrectAnswer {
                      0% { transform: translateX(0); }
                      25% { transform: translateX(-5px); }
                      75% { transform: translateX(5px); }
                      100% { transform: translateX(0); }
                    }
                    .final-score {
                      background: rgba(255,255,255,0.95);
                      border-radius: 15px;
                      padding: 40px;
                      text-align: center;
                      color: #333;
                      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }
                    .final-score h2 {
                      font-size: 2.5rem;
                      margin-bottom: 20px;
                      color: #2d3748;
                    }
                    .score-message {
                      font-size: 1.3rem;
                      margin-bottom: 30px;
                      color: #4a5568;
                    }
                    .restart-btn {
                      padding: 15px 30px;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      border: none;
                      border-radius: 10px;
                      cursor: pointer;
                      font-size: 1.2rem;
                      font-weight: 600;
                      transition: all 0.3s ease;
                    }
                    .restart-btn:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                    }
                  </style>
                </head>
                <body>
                  <div class="quiz-container">
                    <div class="header">
                      <h1>${gameData.title}</h1>
                    </div>
                    
                    <div class="score-info">
                      <strong>Question <span id="current-question">1</span> sur ${gameData.questions.length}</strong>
                      <span style="margin: 0 20px;">|</span>
                      <strong>Score: <span id="current-score">0</span>/${gameData.questions.length}</strong>
                    </div>

                    <div id="question-area" class="question-container">
                      <!-- Question content will be inserted here -->
                    </div>

                    <div id="final-screen" class="final-score" style="display: none;">
                      <h2 id="final-score-text"></h2>
                      <div id="final-message" class="score-message"></div>
                      <button class="restart-btn" onclick="restartQuiz()">🎵 Recommencer le quiz</button>
                    </div>
                  </div>
                  
                  ${!isiOSDevice ? '<script src="https://www.youtube.com/iframe_api"></script>' : ''}
                  
                  <script>
                    const quizData = ${JSON.stringify(gameData)};
                    const isiOSDevice = ${isiOSDevice};
                    let currentQuestionIndex = 0;
                    let score = 0;
                    let answering = false;
                    let player = null;
                    let playerReady = false;

                    // YouTube Player API callback (only for non-iOS)
                    function onYouTubeIframeAPIReady() {
                      if (!isiOSDevice) {
                        console.log('YouTube API ready');
                        showQuestion();
                      }
                    }

                    // Extract YouTube video ID from embed code
                    function extractYouTubeId(embedCode) {
                      const match = embedCode.match(/(?:youtube\\.com\\/embed\\/|youtu\\.be\\/)([^"&?\\/ ]{11})/);
                      return match ? match[1] : null;
                    }

                    function createYouTubePlayer(videoId) {
                      if (isiOSDevice) return Promise.resolve(null);
                      
                      return new Promise((resolve, reject) => {
                        try {
                          if (player) {
                            player.destroy();
                          }
                          
                          player = new YT.Player('player', {
                            height: '315',
                            width: '560',
                            videoId: videoId,
                            playerVars: {
                              'playsinline': 1,
                              'rel': 0,
                              'modestbranding': 1,
                              'controls': 1,
                              'fs': 1,
                              'iv_load_policy': 3,
                              'cc_load_policy': 0,
                              'disablekb': 0,
                              'enablejsapi': 1,
                              'origin': window.location.origin
                            },
                            events: {
                              'onReady': function(event) {
                                console.log('Player ready for video:', videoId);
                                playerReady = true;
                                resolve(event.target);
                              },
                              'onError': function(event) {
                                console.error('Player error:', event.data);
                                reject(event);
                              }
                            }
                          });
                        } catch (error) {
                          console.error('Error creating player:', error);
                          reject(error);
                        }
                      });
                    }

                    function showQuestion() {
                      const question = quizData.questions[currentQuestionIndex];
                      const questionArea = document.getElementById('question-area');
                      
                      document.getElementById('current-question').textContent = currentQuestionIndex + 1;
                      document.getElementById('current-score').textContent = score;
                      
                       // Sur iOS, priorité à l'audio
                       if (isiOSDevice && question.audioUrl) {
                         questionArea.innerHTML = \`
                           <div class="audio-container">
                             <div class="audio-player">
                               <h3>🎵 Écoutez cet extrait audio</h3>
                               <audio controls id="current-audio" style="width: 100%; margin-top: 10px;" preload="metadata">
                                 <source src="\${question.audioUrl}" type="audio/mpeg">
                                 <source src="\${question.audioUrl}" type="audio/mp4">
                                 <source src="\${question.audioUrl}" type="audio/wav">
                                 Votre navigateur ne supporte pas la lecture audio.
                               </audio>
                             </div>
                           </div>
                           \${question.instruction ? \`<div class="instruction">📝 \${question.instruction}</div>\` : ''}
                           \${question.artistTitle ? \`<div class="artist-title">🎤 \${question.artistTitle}</div>\` : ''}
                           <div class="question">\${question.question}</div>
                           <div class="answers">
                             <button class="answer-btn" onclick="selectAnswer('A')">\${question.answerA}</button>
                             <button class="answer-btn" onclick="selectAnswer('B')">\${question.answerB}</button>
                             <button class="answer-btn" onclick="selectAnswer('C')">\${question.answerC}</button>
                           </div>
                         \`;
                         return;
                       }
                      
                      // Sur PC/Android, essayer YouTube d'abord
                      if (!isiOSDevice && question.youtubeEmbed) {
                        const videoId = extractYouTubeId(question.youtubeEmbed);
                        
                        if (videoId) {
                           questionArea.innerHTML = \`
                             <div class="video-container">
                               <div id="player"></div>
                             </div>
                             \${question.instruction ? \`<div class="instruction">📝 \${question.instruction}</div>\` : ''}
                             \${question.artistTitle ? \`<div class="artist-title">🎤 \${question.artistTitle}</div>\` : ''}
                             <div class="question">\${question.question}</div>
                             <div class="answers">
                               <button class="answer-btn" onclick="selectAnswer('A')">\${question.answerA}</button>
                               <button class="answer-btn" onclick="selectAnswer('B')">\${question.answerB}</button>
                               <button class="answer-btn" onclick="selectAnswer('C')">\${question.answerC}</button>
                             </div>
                           \`;
                          
                          createYouTubePlayer(videoId).catch(() => {
                            // Fallback sur audio si YouTube échoue
                            if (question.audioUrl) {
                              showAudioFallback(question);
                            }
                          });
                          return;
                        }
                      }
                      
                      // Fallback audio pour tous les cas
                      if (question.audioUrl) {
                        showAudioFallback(question);
                      } else {
                         // Aucun contenu disponible
                         questionArea.innerHTML = \`
                           \${question.instruction ? \`<div class="instruction">📝 \${question.instruction}</div>\` : ''}
                           \${question.artistTitle ? \`<div class="artist-title">🎤 \${question.artistTitle}</div>\` : ''}
                           <div class="question">\${question.question}</div>
                           <p style="text-align: center; color: #666; margin: 20px 0;">
                             ⚠️ Aucun contenu audio ou vidéo disponible pour cette question
                           </p>
                           <div class="answers">
                             <button class="answer-btn" onclick="selectAnswer('A')">\${question.answerA}</button>
                             <button class="answer-btn" onclick="selectAnswer('B')">\${question.answerB}</button>
                             <button class="answer-btn" onclick="selectAnswer('C')">\${question.answerC}</button>
                           </div>
                         \`;
                      }
                    }
                    
                     function showAudioFallback(question) {
                       const questionArea = document.getElementById('question-area');
                       questionArea.innerHTML = \`
                         <div class="audio-container">
                           <div class="audio-player">
                             <h3>🎵 Écoutez cet extrait audio</h3>
                             <audio controls id="current-audio" style="width: 100%; margin-top: 10px;" preload="metadata">
                               <source src="\${question.audioUrl}" type="audio/mpeg">
                               <source src="\${question.audioUrl}" type="audio/mp4">
                               <source src="\${question.audioUrl}" type="audio/wav">
                               Votre navigateur ne supporte pas la lecture audio.
                             </audio>
                           </div>
                         </div>
                         \${question.instruction ? \`<div class="instruction">📝 \${question.instruction}</div>\` : ''}
                         \${question.artistTitle ? \`<div class="artist-title">🎤 \${question.artistTitle}</div>\` : ''}
                         <div class="question">\${question.question}</div>
                         <div class="answers">
                           <button class="answer-btn" onclick="selectAnswer('A')">\${question.answerA}</button>
                           <button class="answer-btn" onclick="selectAnswer('B')">\${question.answerB}</button>
                           <button class="answer-btn" onclick="selectAnswer('C')">\${question.answerC}</button>
                         </div>
                       \`;
                     }

                    function selectAnswer(selectedAnswer) {
                      if (answering) return;
                      answering = true;
                      
                      // Pause media if playing
                      if (player && playerReady && typeof player.pauseVideo === 'function') {
                        try {
                          player.pauseVideo();
                        } catch (e) {
                          console.log('Could not pause video:', e);
                        }
                      }
                      
                      const audioElement = document.getElementById('current-audio');
                      if (audioElement) {
                        audioElement.pause();
                      }
                      
                      const question = quizData.questions[currentQuestionIndex];
                      const isCorrect = selectedAnswer === question.correctAnswer;
                      const buttons = document.querySelectorAll('.answer-btn');
                      
                      buttons.forEach((btn, index) => {
                        const answer = ['A', 'B', 'C'][index];
                        btn.disabled = true;
                        
                        if (answer === selectedAnswer) {
                          btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                        }
                        
                        if (answer === question.correctAnswer && !isCorrect) {
                          btn.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
                          btn.style.transform = 'scale(1.02)';
                        }
                      });
                      
                      if (isCorrect) {
                        score++;
                        console.log('Score incremented to:', score, 'Question:', currentQuestionIndex + 1);
                        // Mettre à jour l'affichage du score immédiatement
                        document.getElementById('current-score').textContent = score;
                      }
                      
                      // Capturer le score final APRÈS l'incrémentation
                      const finalScore = score;
                      
                      setTimeout(() => {
                        currentQuestionIndex++;
                        console.log('Moving to next question or ending. Current index:', currentQuestionIndex, 'Total questions:', quizData.questions.length, 'Final score captured:', finalScore);
                        if (currentQuestionIndex < quizData.questions.length) {
                          answering = false;
                          showQuestion();
                        } else {
                          showFinalScore(finalScore);
                        }
                      }, 2000);
                    }

                    function showFinalScore(finalScore) {
                      // Destroy player when quiz ends
                      if (player && typeof player.destroy === 'function') {
                        try {
                          player.destroy();
                          player = null;
                          playerReady = false;
                        } catch (e) {
                          console.log('Could not destroy player:', e);
                        }
                      }
                      
                      document.getElementById('question-area').style.display = 'none';
                      document.getElementById('final-screen').style.display = 'block';
                      
                      document.getElementById('final-score-text').textContent = \`Bravo ! Tu as obtenu \${finalScore}/\${quizData.questions.length} 🎉\`;
                      
                      let message = '';
                      if (finalScore <= 3) {
                        message = "Ne t'inquiète pas, tu vas progresser ! 😌";
                      } else if (finalScore <= 6) {
                        message = "Pas mal du tout, continue comme ça ! 👏";
                      } else if (finalScore <= 9) {
                        message = "Bravo, tu as l'oreille musicale ! 🎶";
                      } else {
                        message = "Incroyable, tu es une encyclopédie musicale ! 🏆";
                      }
                      
                      document.getElementById('final-message').textContent = message;
                    }

                    function restartQuiz() {
                      currentQuestionIndex = 0;
                      score = 0;
                      answering = false;
                      playerReady = false;
                      
                      if (player && typeof player.destroy === 'function') {
                        try {
                          player.destroy();
                          player = null;
                        } catch (e) {
                          console.log('Could not destroy player:', e);
                        }
                      }
                      
                      document.getElementById('question-area').style.display = 'block';
                      document.getElementById('final-screen').style.display = 'none';
                      showQuestion();
                    }

                    // Initialize quiz
                    if (isiOSDevice || typeof YT !== 'undefined') {
                      showQuestion();
                    }
                  </script>
                </body>
              </html>
            `);
          }
          return;
        }
        
        if (gameData.type === 'memory_game') {
          // Ouvrir le jeu Memory dans une nouvelle fenêtre
          const newWindow = window.open('', '_blank', 'width=1200,height=800');
          if (newWindow) {
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${title}</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      margin: 0; 
                      padding: 0; 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      background: #f3f4f6; 
                    }
                    .memory-game-container {
                      padding: 20px;
                      max-width: 1000px;
                      margin: 0 auto;
                    }
                    .header {
                      text-align: center;
                      margin-bottom: 30px;
                    }
                    .header h1 {
                      color: #1f2937;
                      margin-bottom: 20px;
                    }
                    .game-info {
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      gap: 20px;
                      margin-bottom: 20px;
                      flex-wrap: wrap;
                    }
                    .moves {
                      font-size: 18px;
                      font-weight: 600;
                    }
                    .difficulty-selector {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                    }
                    .difficulty-selector label {
                      font-size: 14px;
                      font-weight: 500;
                      color: #374151;
                    }
                    .difficulty-selector select {
                      padding: 6px 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 6px;
                      background: white;
                      font-size: 14px;
                      cursor: pointer;
                    }
                    .difficulty-selector select:focus {
                      outline: none;
                      border-color: #3b82f6;
                      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }
                    .reset-btn {
                      padding: 8px 16px;
                      background: #6b7280;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                      font-size: 14px;
                    }
                    .reset-btn:hover {
                      background: #4b5563;
                    }
                    .game-grid {
                      display: grid;
                      gap: 12px;
                      max-width: 600px;
                      margin: 0 auto;
                      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    }
                    .card {
                      aspect-ratio: 1;
                      background: #3b82f6;
                      border-radius: 8px;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      position: relative;
                      overflow: hidden;
                    }
                    .card:hover:not(.flipped):not(.matched) {
                      background: #2563eb;
                      transform: scale(1.05);
                    }
                    .card.flipped, .card.matched {
                      background: white;
                    }
                    .card.matched {
                      border: 2px solid #10b981;
                    }
                    .card img {
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                      border-radius: 6px;
                    }
                    .card-back {
                      color: white;
                      font-size: 24px;
                      font-weight: bold;
                    }
                    .success-message {
                      background: #dcfce7;
                      border: 2px solid #16a34a;
                      padding: 20px;
                      border-radius: 8px;
                      text-align: center;
                      margin-bottom: 20px;
                      color: #15803d;
                      font-size: 18px;
                      font-weight: 600;
                    }
                  </style>
                </head>
                <body>
                  <div class="memory-game-container">
                    <div class="header">
                      <h1>${gameData.title}</h1>
                      <div class="game-info">
                        <div class="moves">Coups: <span id="moves">0</span></div>
                        <div class="difficulty-selector">
                          <label for="difficulty-select">Nombre de cartes:</label>
                          <select id="difficulty-select" onchange="changeDifficulty()">
                            <!-- Options will be populated by JavaScript -->
                          </select>
                        </div>
                        <button class="reset-btn" onclick="resetGame()">🔄 Recommencer</button>
                      </div>
                    </div>
                    <div id="success-message" class="success-message" style="display: none;">
                      🏆 Félicitations ! Jeu terminé en <span id="final-moves"></span> coups !
                    </div>
                    <div id="game-grid" class="game-grid"></div>
                  </div>
                  
                  <script>
                    const gameData = ${JSON.stringify(gameData)};
                    let cards = [];
                    let flippedCards = [];
                    let moves = 0;
                    let gameComplete = false;
                    let numberOfPairs = Math.max(2, Math.min(6, gameData.images.length)); // Default to reasonable number
                    
                    function populateDifficultySelector() {
                      const select = document.getElementById('difficulty-select');
                      const maxCards = gameData.images.length * 2;
                      
                      // Clear existing options
                      select.innerHTML = '';
                      
                      // Generate even numbers starting from 4 up to maxCards
                      for (let cards = 4; cards <= maxCards; cards += 2) {
                        const pairs = cards / 2;
                        const option = document.createElement('option');
                        option.value = pairs;
                        option.textContent = cards + ' cartes';
                        if (pairs === numberOfPairs) {
                          option.selected = true;
                        }
                        select.appendChild(option);
                      }
                    }
                    
                    function changeDifficulty() {
                      const select = document.getElementById('difficulty-select');
                      numberOfPairs = parseInt(select.value);
                      initializeGame();
                    }
                    
                    function initializeGame() {
                      // Use only the selected number of images
                      const selectedImages = gameData.images.slice(0, numberOfPairs);
                      
                      const pairs = [];
                      selectedImages.forEach((imageUrl, index) => {
                        pairs.push(
                          { id: index * 2, imageUrl, isFlipped: false, isMatched: false },
                          { id: index * 2 + 1, imageUrl, isFlipped: false, isMatched: false }
                        );
                      });
                      
                      cards = pairs.sort(() => Math.random() - 0.5);
                      flippedCards = [];
                      moves = 0;
                      gameComplete = false;
                      
                      document.getElementById('moves').textContent = moves;
                      document.getElementById('success-message').style.display = 'none';
                      renderCards();
                    }
                    
                    function renderCards() {
                      const grid = document.getElementById('game-grid');
                      const cols = Math.ceil(Math.sqrt(cards.length));
                      grid.style.gridTemplateColumns = \`repeat(\${cols}, 1fr)\`;
                      
                      grid.innerHTML = cards.map(card => \`
                        <div class="card \${card.isFlipped ? 'flipped' : ''} \${card.isMatched ? 'matched' : ''} 
                             onclick="handleCardClick(\${card.id})">
                          \${card.isFlipped || card.isMatched ? 
                            \`<img src="\${card.imageUrl}" alt="Memory card">\` : 
                            '<div class="card-back">?</div>'
                          }
                        </div>
                      \`).join('');
                    }
                    
                    function handleCardClick(cardId) {
                      if (gameComplete) return;
                      if (flippedCards.length >= 2) return;
                      if (flippedCards.includes(cardId)) return;
                      
                      const card = cards.find(c => c.id === cardId);
                      if (card.isMatched) return;
                      
                      flippedCards.push(cardId);
                      card.isFlipped = true;
                      renderCards();
                      
                      if (flippedCards.length === 2) {
                        moves++;
                        document.getElementById('moves').textContent = moves;
                        
                        const [firstId, secondId] = flippedCards;
                        const firstCard = cards.find(c => c.id === firstId);
                        const secondCard = cards.find(c => c.id === secondId);
                        
                        if (firstCard.imageUrl === secondCard.imageUrl) {
                          setTimeout(() => {
                            firstCard.isMatched = true;
                            secondCard.isMatched = true;
                            flippedCards = [];
                            renderCards();
                            
                            if (cards.every(c => c.isMatched)) {
                              gameComplete = true;
                              document.getElementById('final-moves').textContent = moves;
                              document.getElementById('success-message').style.display = 'block';
                            }
                          }, 500);
                        } else {
                          setTimeout(() => {
                            firstCard.isFlipped = false;
                            secondCard.isFlipped = false;
                            flippedCards = [];
                            renderCards();
                          }, 1000);
                        }
                      }
                    }
                    
                    function resetGame() {
                      initializeGame();
                    }
                    
                    // Initialize the game and populate selector on load
                    populateDifficultySelector();
                    initializeGame();
                  </script>
                </body>
              </html>
            `);
          }
          return;
        }
      } catch (e) {
        // Si ce n'est pas du JSON valide, traiter comme un iframe normal
      }
      
      // Code iframe normal
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; padding: 20px; background: #000; }
                iframe { width: 100%; height: 500px; }
              </style>
            </head>
            <body>
              <h2 style="color: white; text-align: center;">${title}</h2>
              ${iframeCode}
            </body>
          </html>
        `);
      }
    } else {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  // Déterminer si on doit afficher un avertissement iOS
  const shouldShowIOSWarning = () => {
    if (!iframeCode) return false;
    
    try {
      const gameData = JSON.parse(iframeCode);
      if (gameData.type === 'music_quiz') {
        return !audioUrl && !gameData.questions.some((q: any) => q.audioUrl);
      }
    } catch (e) {
      // Pas un JSON valide
    }
    
    return false;
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="relative">
        <img
          src={getDisplayImage()}
          alt={title}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        {(isYouTube || iframeCode) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-t-lg">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
            </div>
          </div>
        )}
        
        {/* Avertissement iOS pour quiz sans audio */}
        {shouldShowIOSWarning() && isIOS() && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            iOS incompatible
          </div>
        )}

        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEditClick}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {showEditButton && onEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
        {subActivityName && (
          <Badge variant="secondary" className="w-fit">
            {subActivityName}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          {activityDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(activityDate).toLocaleDateString('fr-FR')}
            </div>
          )}
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;

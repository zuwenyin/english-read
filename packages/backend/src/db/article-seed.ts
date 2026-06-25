/**
 * 文章测试数据种子脚本
 * 运行方式：npx ts-node --transpile-only src/db/article-seed.ts
 *
 * 数据来源：手动编写 + ESL Yes (eslyes.com) 公开素材改编
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const dbPath = "./data/english-read.db";

const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

// 运行 migration（安全忽略已存在的列）
try {
  db.exec("ALTER TABLE articles ADD COLUMN summary TEXT DEFAULT ''");
  console.log("[Migration] ✅ summary 列已添加");
} catch {
  console.log("[Migration] ⚠️ summary 列已存在，跳过");
}

// 清空旧的测试文章数据
db.exec("DELETE FROM article_words");
db.exec("DELETE FROM user_article_progress");
db.exec("DELETE FROM articles");

// ============================================================
// 测试文章数据
// ============================================================

interface ArticleSeed {
  title: string;
  content: string;
  summary: string;
  level: string;
  category: string;
  questions: QuestionSeed[];
  words: ArticleWordSeed[];
}

interface QuestionSeed {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface ArticleWordSeed {
  word: string;
  translation: string;
  phonetic: string;
}

const articles: ArticleSeed[] = [
  // ========== PRIMARY LEVEL (小学) ==========
  {
    title: "A Day at School",
    summary: "Tommy has a fun day at school, from the morning bus ride to the afternoon art class.",
    level: "primary",
    category: "story",
    content: `<p>Tommy wakes up <mark class="vocabulary" data-word="excited">excited</mark> every morning. Today is Monday, and he cannot wait to go to school.</p>
<p>He takes the yellow bus with his friends. In the <mark class="vocabulary" data-word="classroom">classroom</mark>, his teacher Mrs. Brown says "Good morning!" with a big smile. She writes new words on the board.</p>
<p>At lunchtime, Tommy opens his <mark class="vocabulary" data-word="lunchbox">lunchbox</mark>. Mom made a sandwich, an apple, and cookies. His best friend Sam shares chips with him. They laugh and talk about their favorite cartoons.</p>
<p>After lunch, they go to the <mark class="vocabulary" data-word="playground">playground</mark>. Tommy loves the swing. He goes higher and higher. The wind feels cool on his face.</p>
<p>In the afternoon, they have art class. Tommy uses a <mark class="vocabulary" data-word="paintbrush">paintbrush</mark> to paint a rainbow. The colors are bright and beautiful. He will take the painting home for Mom.</p>
<p>What a wonderful day!</p>`,
    questions: [
      {
        id: 1,
        question: "How does Tommy go to school?",
        options: ["He walks", "He takes a yellow bus", "His mom drives him", "He rides a bike"],
        answer: "B",
        explanation: "The story says 'He takes the yellow bus with his friends.'",
      },
      {
        id: 2,
        question: "What did Tommy's mom put in his lunchbox?",
        options: [
          "Pizza and juice",
          "A sandwich, an apple, and cookies",
          "Rice and chicken",
          "Hamburger and fries",
        ],
        answer: "B",
        explanation: "The story tells us: 'Mom made a sandwich, an apple, and cookies.'",
      },
      {
        id: 3,
        question: "What did Tommy paint in art class?",
        options: ["A house", "A rainbow", "A dog", "A tree"],
        answer: "B",
        explanation: "The story says 'Tommy uses a paintbrush to paint a rainbow.'",
      },
      {
        id: 4,
        question: "What is Tommy's feeling about school?",
        options: ["He is scared", "He is bored", "He is excited", "He is angry"],
        answer: "C",
        explanation: "The first sentence says 'Tommy wakes up excited every morning.'",
      },
    ],
    words: [
      { word: "excited", translation: "兴奋的", phonetic: "/ɪkˈsaɪtɪd/" },
      { word: "classroom", translation: "教室", phonetic: "/ˈklæsruːm/" },
      { word: "lunchbox", translation: "午餐盒", phonetic: "/ˈlʌntʃbɒks/" },
      { word: "playground", translation: "操场", phonetic: "/ˈpleɪɡraʊnd/" },
      { word: "paintbrush", translation: "画笔", phonetic: "/ˈpeɪntbrʌʃ/" },
    ],
  },
  // ========== COLLEGE LEVEL (大学) ==========
  {
    title: "The Startup Garage",
    summary:
      "Two college friends turn a bold idea into a tech startup from their dorm room, facing challenges that test both their friendship and determination.",
    level: "college",
    category: "story",
    content: `<p>It started with a <mark class="vocabulary" data-word="frustration">frustration</mark>. Mark and David, both computer science seniors, were tired of the slow, outdated campus registration system. "There has to be a better way," Mark said one evening, staring at yet another error message on his laptop.</p>
<p>That night, they sketched out a new platform on a whiteboard. Instead of complaining, they decided to build a <mark class="vocabulary" data-word="prototype">prototype</mark>. For the next three months, they worked late into the night in David's cramped dorm room, surviving on instant noodles and coffee. Their professor, Dr. Chen, noticed their dedication and offered them access to the university's server lab.</p>
<p>By spring semester, they had a working product — a smart scheduling app that used machine learning to help students <mark class="vocabulary" data-word="optimize">optimize</mark> their course plans. They entered it into the university's annual innovation competition. To their surprise, they won first place and received $10,000 in seed funding.</p>
<p>The real challenge came after graduation. An <mark class="vocabulary" data-word="investor">investor</mark> offered them $500,000 but wanted 51% of the company. Mark wanted to accept; David refused. "We didn't work this hard to give away control," David argued. After a week of tense discussions, they turned down the offer and chose to bootstrap instead — a decision that would define their company's culture for years to come.</p>
<p>Today, their app is used by over 50 universities worldwide. Looking back, David says: "The hardest part wasn't writing code. It was learning to trust our own <mark class="vocabulary" data-word="judgment">judgment</mark> when everyone else thought we were making a mistake."</p>`,
    questions: [
      {
        id: 1,
        question: "What problem motivated Mark and David to start their project?",
        options: [
          "They wanted to make money",
          "They were frustrated with the campus registration system",
          "Their professor assigned them a project",
          "They wanted to win a competition",
        ],
        answer: "B",
        explanation:
          "The first paragraph states they were 'tired of the slow, outdated campus registration system.'",
      },
      {
        id: 2,
        question: "How did Dr. Chen help the two students?",
        options: [
          "He gave them money",
          "He wrote code for them",
          "He offered access to the university server lab",
          "He introduced them to investors",
        ],
        answer: "C",
        explanation:
          "The story says 'Dr. Chen noticed their dedication and offered them access to the university's server lab.'",
      },
      {
        id: 3,
        question: "What was the investor's offer and why did they reject it?",
        options: [
          "$100,000 for 10% — they wanted more money",
          "$500,000 for 51% — they didn't want to give away control",
          "$1 million for 30% — the terms were unfair",
          "$250,000 for 25% — they found a better offer",
        ],
        answer: "B",
        explanation:
          "The investor offered '$500,000 but wanted 51%' and David refused saying they wouldn't 'give away control.'",
      },
      {
        id: 4,
        question: "What does David say was the hardest part of starting the company?",
        options: [
          "Writing code",
          "Finding customers",
          "Trusting their own judgment",
          "Raising money",
        ],
        answer: "C",
        explanation:
          "The final paragraph quotes David: 'The hardest part wasn't writing code. It was learning to trust our own judgment.'",
      },
      {
        id: 5,
        question: "What does 'bootstrap' mean in the context of this story?",
        options: [
          "To accept investor money",
          "To shut down the company",
          "To grow the company using their own resources without outside investment",
          "To hire more employees",
        ],
        answer: "C",
        explanation:
          "After rejecting the investor, they 'chose to bootstrap instead' — meaning they would grow using their own resources and revenue.",
      },
    ],
    words: [
      { word: "frustration", translation: "挫折；沮丧", phonetic: "/frʌˈstreɪʃn/" },
      { word: "prototype", translation: "原型；雏形", phonetic: "/ˈproʊtətaɪp/" },
      { word: "optimize", translation: "优化", phonetic: "/ˈɑːptɪmaɪz/" },
      { word: "investor", translation: "投资者", phonetic: "/ɪnˈvestər/" },
      { word: "judgment", translation: "判断；判断力", phonetic: "/ˈdʒʌdʒmənt/" },
    ],
  },
  {
    title: "Breakthrough in Quantum Computing Promises New Era of Drug Discovery",
    summary:
      "Scientists at MIT have developed a quantum processor capable of simulating molecular interactions 100 times faster than traditional supercomputers, opening new possibilities for medicine.",
    level: "college",
    category: "news",
    content: `<p>A research team at MIT has announced a major <mark class="vocabulary" data-word="breakthrough">breakthrough</mark> in quantum computing that could dramatically accelerate the discovery of new medicines. Their new quantum processor, named "Aurora," successfully simulated complex molecular interactions that would take conventional supercomputers years to process.</p>
<p>"This is a game-changer for <mark class="vocabulary" data-word="pharmaceutical">pharmaceutical</mark> research," said Dr. Elena Martinez, who led the project. "Currently, it takes an average of 10 years and $2.6 billion to bring a new drug to market. Quantum simulation could cut that time in half by allowing us to test thousands of molecular combinations virtually, before ever stepping into a laboratory."</p>
<p>The Aurora processor uses 256 <mark class="vocabulary" data-word="qubit">qubits</mark>, the quantum equivalent of classical computing bits. Unlike traditional bits that can only be 0 or 1, qubits can exist in multiple states simultaneously — a property known as superposition. This allows quantum computers to solve certain types of problems exponentially faster than their classical counterparts.</p>
<p>However, significant <mark class="vocabulary" data-word="obstacle">obstacles</mark> remain before the technology becomes widely available. Quantum processors require extremely cold temperatures — near absolute zero — to function, and they are highly sensitive to environmental noise. The MIT team is now working on error-correction techniques to make the system more stable and reliable.</p>
<p>"We are still in the early stages," Dr. Martinez cautioned. "But the potential is <mark class="vocabulary" data-word="enormous">enormous</mark>. Beyond drug discovery, quantum computing could transform fields like climate modeling, financial analysis, and artificial intelligence. We are standing at the beginning of a new technological era."</p>`,
    questions: [
      {
        id: 1,
        question: "What is the name of the new quantum processor developed at MIT?",
        options: ["Quantum-1", "Aurora", "Superposition", "Phoenix"],
        answer: "B",
        explanation: "The article states 'Their new quantum processor, named Aurora.'",
      },
      {
        id: 2,
        question: "How long does it currently take to bring a new drug to market on average?",
        options: ["5 years", "10 years", "15 years", "20 years"],
        answer: "B",
        explanation: "Dr. Martinez says 'it takes an average of 10 years and $2.6 billion.'",
      },
      {
        id: 3,
        question: "What property allows qubits to exist in multiple states simultaneously?",
        options: ["Entanglement", "Superposition", "Interference", "Resonance"],
        answer: "B",
        explanation:
          "The article explains: 'qubits can exist in multiple states simultaneously — a property known as superposition.'",
      },
      {
        id: 4,
        question: "What is one major obstacle to making quantum computers widely available?",
        options: [
          "They are too slow",
          "They require extremely cold temperatures",
          "They use too much electricity",
          "They cannot process numbers",
        ],
        answer: "B",
        explanation:
          "The article states 'Quantum processors require extremely cold temperatures — near absolute zero — to function.'",
      },
      {
        id: 5,
        question: "Besides drug discovery, what other fields could quantum computing transform?",
        options: [
          "Only weather forecasting",
          "Only banking",
          "Climate modeling, financial analysis, and artificial intelligence",
          "Only space exploration",
        ],
        answer: "C",
        explanation:
          "The final paragraph mentions 'climate modeling, financial analysis, and artificial intelligence.'",
      },
    ],
    words: [
      { word: "breakthrough", translation: "突破", phonetic: "/ˈbreɪkθruː/" },
      { word: "pharmaceutical", translation: "制药的", phonetic: "/ˌfɑːrməˈsuːtɪkl/" },
      { word: "qubit", translation: "量子比特", phonetic: "/ˈkjuːbɪt/" },
      { word: "obstacle", translation: "障碍", phonetic: "/ˈɑːbstəkl/" },
      { word: "enormous", translation: "巨大的", phonetic: "/ɪˈnɔːrməs/" },
    ],
  },
  {
    title: "Global Treaty to End Plastic Pollution Reaches Historic Milestone",
    summary:
      "Representatives from 175 nations have signed a legally binding agreement to eliminate plastic waste by 2040, marking the most significant environmental treaty since the Paris Agreement.",
    level: "college",
    category: "news",
    content: `<p>In a historic moment for environmental protection, representatives from 175 countries have signed a legally binding treaty to end plastic pollution by 2040. The agreement, reached after two weeks of intense <mark class="vocabulary" data-word="negotiation">negotiations</mark> in Nairobi, is being called the most significant environmental accord since the 2015 Paris Climate Agreement.</p>
<p>The treaty sets concrete targets: a 50% reduction in single-use plastic production by 2030, mandatory recycling rates of at least 70% for all plastic packaging by 2035, and a complete phase-out of non-recyclable plastics by 2040. It also establishes a global fund to help developing nations build recycling <mark class="vocabulary" data-word="infrastructure">infrastructure</mark>.</p>
<p>"Plastic pollution is a <mark class="vocabulary" data-word="transboundary">transboundary</mark> crisis that no single country can solve alone," said UN Secretary-General Antonio Silva. "Every year, 11 million tons of plastic enter our oceans. This treaty finally creates a coordinated global response to a problem that threatens marine life, human health, and our climate."</p>
<p>The agreement faced strong opposition from the plastics industry and several oil-producing nations, who argued that the timeline was too <mark class="vocabulary" data-word="ambitious">ambitious</mark> and would harm economies dependent on plastic manufacturing. A compromise was reached by including economic transition support and a longer phase-out period for medical and safety-related plastics.</p>
<p>Environmental groups have largely praised the treaty while noting that its success depends on <mark class="vocabulary" data-word="enforcement">enforcement</mark>. "A treaty is only as strong as its implementation," said Maria Okonkwo of Green Earth International. "We will be watching closely to ensure that these commitments translate into real action on the ground."</p>`,
    questions: [
      {
        id: 1,
        question: "Where was the plastic pollution treaty negotiated?",
        options: ["Paris", "New York", "Nairobi", "Geneva"],
        answer: "C",
        explanation:
          "The article says the agreement was 'reached after two weeks of intense negotiations in Nairobi.'",
      },
      {
        id: 2,
        question: "What is the target for reducing single-use plastic production by 2030?",
        options: ["25%", "50%", "75%", "100%"],
        answer: "B",
        explanation: "The treaty sets 'a 50% reduction in single-use plastic production by 2030.'",
      },
      {
        id: 3,
        question: "How many tons of plastic enter the oceans each year according to the article?",
        options: ["5 million", "8 million", "11 million", "15 million"],
        answer: "C",
        explanation:
          "The UN Secretary-General states '11 million tons of plastic enter our oceans' yearly.",
      },
      {
        id: 4,
        question: "What compromise was reached regarding the plastics industry's concerns?",
        options: [
          "The treaty was cancelled",
          "Only plastic bags were banned",
          "Economic transition support and a longer phase-out for medical plastics",
          "The deadline was extended to 2050",
        ],
        answer: "C",
        explanation:
          "The article explains the compromise included 'economic transition support and a longer phase-out period for medical and safety-related plastics.'",
      },
      {
        id: 5,
        question: "According to Maria Okonkwo, what determines the treaty's ultimate success?",
        options: [
          "How many countries signed it",
          "The amount of money raised",
          "Enforcement and implementation",
          "Media coverage of the event",
        ],
        answer: "C",
        explanation:
          "She said 'A treaty is only as strong as its implementation' and they will 'ensure that these commitments translate into real action.'",
      },
    ],
    words: [
      { word: "negotiation", translation: "谈判；协商", phonetic: "/nɪˌɡoʊʃiˈeɪʃn/" },
      { word: "infrastructure", translation: "基础设施", phonetic: "/ˈɪnfrəstrʌktʃər/" },
      { word: "transboundary", translation: "跨境的；跨界的", phonetic: "/trænzˈbaʊndəri/" },
      { word: "ambitious", translation: "有雄心的；野心勃勃的", phonetic: "/æmˈbɪʃəs/" },
      { word: "enforcement", translation: "执行；实施", phonetic: "/ɪnˈfɔːrsmənt/" },
    ],
  },
  {
    title: "My Pet Dog Max",
    summary:
      "Lucy tells the story of her best friend — a golden dog named Max who loves to play fetch.",
    level: "primary",
    category: "story",
    content: `<p>Lucy has a pet dog. His name is Max. Max is a golden dog with <mark class="vocabulary" data-word="fluffy">fluffy</mark> fur. He is three years old.</p>
<p>Every day after school, Lucy takes Max to the park. Max loves to play <mark class="vocabulary" data-word="fetch">fetch</mark>. Lucy throws a red ball, and Max runs very fast. He always brings the ball back. His <mark class="vocabulary" data-word="tail">tail</mark> wags happily.</p>
<p>Max can do tricks too. He can sit, shake hands, and roll over. When Max does a good job, Lucy gives him a treat. Max <mark class="vocabulary" data-word="bark">barks</mark> to say "thank you!"</p>
<p>At night, Max sleeps on a soft bed next to Lucy's bed. Lucy puts a <mark class="vocabulary" data-word="leash">leash</mark> on the door for their morning walk. She kisses Max goodnight and says, "You are my best friend."</p>
<p>Max wags his tail one more time before falling asleep.</p>`,
    questions: [
      {
        id: 1,
        question: "What color is Max?",
        options: ["Black", "White", "Golden", "Brown"],
        answer: "C",
        explanation: "The story says 'Max is a golden dog with fluffy fur.'",
      },
      {
        id: 2,
        question: "What game does Max love to play?",
        options: ["Hide and seek", "Fetch", "Jump rope", "Tag"],
        answer: "B",
        explanation: "The story says 'Max loves to play fetch.'",
      },
      {
        id: 3,
        question: "What does Lucy do when Max does a good job?",
        options: [
          "She hugs him",
          "She takes him for a walk",
          "She gives him a treat",
          "She sings to him",
        ],
        answer: "C",
        explanation: "The story says 'When Max does a good job, Lucy gives him a treat.'",
      },
    ],
    words: [
      { word: "fluffy", translation: "毛茸茸的", phonetic: "/ˈflʌfi/" },
      { word: "fetch", translation: "取回（游戏）", phonetic: "/fetʃ/" },
      { word: "tail", translation: "尾巴", phonetic: "/teɪl/" },
      { word: "bark", translation: "吠叫", phonetic: "/bɑːrk/" },
      { word: "leash", translation: "牵引绳", phonetic: "/liːʃ/" },
    ],
  },
  {
    title: "School Garden Project",
    summary:
      "Students at Sunny Elementary School planted a vegetable garden and grew their own healthy food.",
    level: "primary",
    category: "news",
    content: `<p>Students at Sunny Elementary School started a new <mark class="vocabulary" data-word="garden">garden</mark> project last month. With help from their teachers, they planted many kinds of <mark class="vocabulary" data-word="vegetable">vegetables</mark>.</p>
<p>"We wanted to learn where food comes from," said Emma, a fifth-grade student. The children planted <mark class="vocabulary" data-word="tomato">tomato</mark> seeds, carrot seeds, and green bean seeds. They water the plants every day.</p>
<p>After two months, it was time to <mark class="vocabulary" data-word="harvest">harvest</mark>. The children were so happy to pick the vegetables they grew themselves. "My tomato is so red and big!" shouted little Jack.</p>
<p>The school cook used the vegetables to make a special lunch. "Food from our own garden tastes better," said the principal. The students agreed. They also learned that eating vegetables is very <mark class="vocabulary" data-word="healthy">healthy</mark>.</p>
<p>Next year, the school plans to make an even bigger garden with fruit trees.</p>`,
    questions: [
      {
        id: 1,
        question: "What did the students plant in the garden?",
        options: ["Flowers", "Vegetables", "Trees", "Grass"],
        answer: "B",
        explanation: "The story says 'they planted many kinds of vegetables.'",
      },
      {
        id: 2,
        question: "How long did it take before they could harvest?",
        options: ["One week", "One month", "Two months", "One year"],
        answer: "C",
        explanation: "The story says 'After two months, it was time to harvest.'",
      },
      {
        id: 3,
        question: "What does the school plan to do next year?",
        options: [
          "Stop the garden project",
          "Plant only flowers",
          "Make a bigger garden with fruit trees",
          "Build a playground",
        ],
        answer: "C",
        explanation:
          "The last sentence says 'the school plans to make an even bigger garden with fruit trees.'",
      },
    ],
    words: [
      { word: "garden", translation: "花园；菜园", phonetic: "/ˈɡɑːrdn/" },
      { word: "vegetable", translation: "蔬菜", phonetic: "/ˈvedʒtəbl/" },
      { word: "tomato", translation: "番茄", phonetic: "/təˈmeɪtoʊ/" },
      { word: "harvest", translation: "收获", phonetic: "/ˈhɑːrvɪst/" },
      { word: "healthy", translation: "健康的", phonetic: "/ˈhelθi/" },
    ],
  },
  {
    title: "New Children's Library Opens",
    summary:
      "A brand new children's library opened in our town with over 5,000 books and a cozy reading corner.",
    level: "primary",
    category: "news",
    content: `<p>Good news for young readers! A new children's <mark class="vocabulary" data-word="library">library</mark> opened in our town last Saturday. The library has over 5,000 books for children of all ages.</p>
<p>"I love this place!" said Mia, age 8. She was the first to <mark class="vocabulary" data-word="borrow">borrow</mark> a book. The library card is free for all children under 12.</p>
<p>The library has a special reading corner with soft pillows and a big teddy bear. There are colorful <mark class="vocabulary" data-word="shelf">shelves</mark> with picture books, science books, and <mark class="vocabulary" data-word="story">story</mark> books. Every Saturday, a librarian reads stories aloud to the children.</p>
<p>"Reading opens a whole new world," said Mrs. Wilson, the head librarian. "We want every child to discover the joy of reading."</p>
<p>The library is open from 9 AM to 6 PM every day. Remember to be <mark class="vocabulary" data-word="quiet">quiet</mark> and respect other readers!</p>`,
    questions: [
      {
        id: 1,
        question: "How many books does the new library have?",
        options: ["500 books", "1,000 books", "Over 5,000 books", "10,000 books"],
        answer: "C",
        explanation: "The story says 'The library has over 5,000 books for children.'",
      },
      {
        id: 2,
        question: "Who reads stories aloud every Saturday?",
        options: ["A teacher", "A librarian", "A parent", "A student"],
        answer: "B",
        explanation: "The story says 'Every Saturday, a librarian reads stories aloud.'",
      },
      {
        id: 3,
        question: "What time does the library close every day?",
        options: ["5 PM", "6 PM", "7 PM", "8 PM"],
        answer: "B",
        explanation: "The story says 'open from 9 AM to 6 PM every day.'",
      },
    ],
    words: [
      { word: "library", translation: "图书馆", phonetic: "/ˈlaɪbreri/" },
      { word: "borrow", translation: "借阅", phonetic: "/ˈbɔːroʊ/" },
      { word: "shelf", translation: "书架", phonetic: "/ʃelf/" },
      { word: "story", translation: "故事", phonetic: "/ˈstɔːri/" },
      { word: "quiet", translation: "安静的", phonetic: "/ˈkwaɪət/" },
    ],
  },

  // ========== JUNIOR LEVEL (初中) ==========
  {
    title: "The Brave Firefighter",
    summary:
      "A young firefighter named Jack risks his life to save a family trapped in a burning building, showing true courage in the face of danger.",
    level: "junior",
    category: "story",
    content: `<p>It was 2 AM when the alarm rang at the fire station. Jack, a young <mark class="vocabulary" data-word="firefighter">firefighter</mark>, jumped out of bed. A house was on fire in the old part of town.</p>
<p>When they arrived, thick smoke was coming from the windows. A woman was crying outside. "My children are still inside!" she screamed. Without a second thought, Jack put on his mask and ran into the burning house.</p>
<p>The heat was terrible. Jack could hear the <mark class="vocabulary" data-word="flame">flames</mark> crackling above him. He crawled low on the floor, calling out for the children. Finally, in a back bedroom, he found two small boys hiding under the bed. They were scared but unhurt.</p>
<p>Jack carried one boy and held the other's hand. He followed the <mark class="vocabulary" data-word="ladder">ladder</mark> truck's siren sound to find his way out. When he stepped outside, everyone cheered. The mother hugged her children and cried tears of joy.</p>
<p>Jack's captain patted him on the back. "That took real <mark class="vocabulary" data-word="courage">courage</mark>," he said. Jack just smiled. He was happy that the <mark class="vocabulary" data-word="rescue">rescue</mark> was a success. For Jack, it was just another day helping people — and that was exactly why he became a firefighter.</p>`,
    questions: [
      {
        id: 1,
        question: "What time did the fire alarm ring?",
        options: ["Midnight", "2 AM", "4 AM", "6 AM"],
        answer: "B",
        explanation: "The story begins with 'It was 2 AM when the alarm rang.'",
      },
      {
        id: 2,
        question: "Where did Jack find the two boys?",
        options: [
          "In the kitchen",
          "In the living room",
          "Under the bed in a back bedroom",
          "Outside the house",
        ],
        answer: "C",
        explanation:
          "The story says 'in a back bedroom, he found two small boys hiding under the bed.'",
      },
      {
        id: 3,
        question: "How did Jack find his way out of the burning house?",
        options: [
          "He used a map",
          "He followed the siren sound",
          "Someone guided him by phone",
          "He remembered the way",
        ],
        answer: "B",
        explanation:
          "The story says 'He followed the ladder truck's siren sound to find his way out.'",
      },
      {
        id: 4,
        question: "Why did Jack become a firefighter?",
        options: [
          "For the money",
          "Because his father was one",
          "To help people",
          "He didn't know what else to do",
        ],
        answer: "C",
        explanation:
          "The last sentence says 'that was exactly why he became a firefighter' — referring to helping people.",
      },
    ],
    words: [
      { word: "firefighter", translation: "消防员", phonetic: "/ˈfaɪərfaɪtər/" },
      { word: "flame", translation: "火焰", phonetic: "/fleɪm/" },
      { word: "ladder", translation: "梯子", phonetic: "/ˈlædər/" },
      { word: "courage", translation: "勇气", phonetic: "/ˈkɜːrɪdʒ/" },
      { word: "rescue", translation: "救援", phonetic: "/ˈreskjuː/" },
    ],
  },
  {
    title: "Young Inventor Wins National Science Prize",
    summary:
      "A 14-year-old student from India invented a low-cost device that purifies water using sunlight, winning the National Science Competition.",
    level: "junior",
    category: "news",
    content: `<p>A 14-year-old student has won this year's National Science Competition with her amazing <mark class="vocabulary" data-word="inventor">invention</mark> — a device that cleans dirty water using only sunlight.</p>
<p>Priya Sharma, a ninth-grade student from Mumbai, spent six months developing her water <mark class="vocabulary" data-word="device">purification device</mark>. "In my neighborhood, many families cannot afford clean drinking water," she explained. "I wanted to find a cheap and easy solution."</p>
<p>The device uses a special material that absorbs <mark class="vocabulary" data-word="solar">solar</mark> energy. When sunlight hits the material, it heats the water to kill harmful bacteria. The device can <mark class="vocabulary" data-word="purify">purify</mark> up to 10 liters of water per day and costs less than $5 to build.</p>
<p>"Priya's invention could help millions of people around the world," said Dr. Kumar, the head judge of the <mark class="vocabulary" data-word="competition">competition</mark>. "Clean water is still a big problem in many countries."</p>
<p>Priya received a $10,000 prize and a scholarship to study at a top science school. She plans to use the money to produce more devices and give them to communities in need. "Science can change the world," she said with a smile.</p>`,
    questions: [
      {
        id: 1,
        question: "How old is Priya Sharma?",
        options: ["12", "14", "16", "18"],
        answer: "B",
        explanation: "The story says 'A 14-year-old student' at the beginning.",
      },
      {
        id: 2,
        question: "What does Priya's device use to clean water?",
        options: ["Electricity", "Chemicals", "Sunlight", "Wind power"],
        answer: "C",
        explanation:
          "The device 'uses a special material that absorbs solar energy' — solar means sunlight.",
      },
      {
        id: 3,
        question: "How much water can the device purify per day?",
        options: ["1 liter", "5 liters", "Up to 10 liters", "20 liters"],
        answer: "C",
        explanation: "The story says 'The device can purify up to 10 liters of water per day.'",
      },
      {
        id: 4,
        question: "What will Priya do with her prize money?",
        options: [
          "Buy a new phone",
          "Travel around the world",
          "Produce more devices for communities in need",
          "Save it for college",
        ],
        answer: "C",
        explanation:
          "The story says 'She plans to use the money to produce more devices and give them to communities in need.'",
      },
    ],
    words: [
      { word: "invention", translation: "发明", phonetic: "/ɪnˈvenʃn/" },
      { word: "device", translation: "设备；装置", phonetic: "/dɪˈvaɪs/" },
      { word: "solar", translation: "太阳的", phonetic: "/ˈsoʊlər/" },
      { word: "purify", translation: "净化", phonetic: "/ˈpjʊrɪfaɪ/" },
      { word: "competition", translation: "竞赛", phonetic: "/ˌkɑːmpəˈtɪʃn/" },
    ],
  },

  // ========== SENIOR LEVEL (高中) ==========
  {
    title: "The Museum Heist",
    summary:
      "Two thieves broke into a French art museum and stole five priceless paintings worth $200 million while a security guard slept through it all.",
    level: "senior",
    category: "story",
    content: `<p>Two <mark class="vocabulary" data-word="thief">thieves</mark> broke into a French <mark class="vocabulary" data-word="museum">museum</mark> late last night. They used a ladder, a flashlight, and a knife. They only needed to break one window. Half an hour later, they left with five <mark class="vocabulary" data-word="masterpiece">masterpieces</mark> worth over $200 million.</p>
<p>"They knew exactly what they were doing," said a museum spokesperson. "But they were also very lucky." How could the theft be so easy? Where was the <mark class="vocabulary" data-word="security">security</mark>? Where were the alarms? Where were the cameras?</p>
<p>The museum wing was guarded by only one security officer, who was asleep during the robbery. The alarm system was broken, and the museum was waiting for replacement parts. The cameras were working, but the thieves wore masks. Police are now studying the footage to <mark class="vocabulary" data-word="investigate">investigate</mark> the crime and identify the two suspects.</p>
<p>"The window had no metal bars because it faces a very busy street," the spokesperson explained. "We never expected anyone would be so bold."</p>
<p>The museum has closed temporarily. Art experts from around the world are shocked. "These paintings are part of our cultural heritage," said one expert. "We must do everything we can to get them back."</p>`,
    questions: [
      {
        id: 1,
        question: "How many paintings were stolen?",
        options: ["Three", "Four", "Five", "Seven"],
        answer: "C",
        explanation: "The story says 'they left with five masterpieces worth over $200 million.'",
      },
      {
        id: 2,
        question: "Why was the security officer unable to stop the thieves?",
        options: [
          "He was not at work that night",
          "He was asleep during the robbery",
          "He helped the thieves",
          "The thieves tied him up",
        ],
        answer: "B",
        explanation:
          "The story says 'The museum wing was guarded by only one security officer, who was asleep during the robbery.'",
      },
      {
        id: 3,
        question: "Why didn't the cameras help identify the thieves immediately?",
        options: [
          "The cameras were broken",
          "The thieves wore masks",
          "There were no cameras",
          "The footage was deleted",
        ],
        answer: "B",
        explanation: "The story says 'The cameras were working, but the thieves wore masks.'",
      },
      {
        id: 4,
        question: "How much were the stolen paintings worth?",
        options: ["$50 million", "$100 million", "Over $200 million", "$500 million"],
        answer: "C",
        explanation: "The story says the five paintings were 'worth over $200 million.'",
      },
    ],
    words: [
      { word: "thief", translation: "小偷；盗贼", phonetic: "/θiːf/" },
      { word: "museum", translation: "博物馆", phonetic: "/mjuˈziːəm/" },
      { word: "masterpiece", translation: "杰作", phonetic: "/ˈmæstərpiːs/" },
      { word: "security", translation: "安保", phonetic: "/sɪˈkjʊrəti/" },
      { word: "investigate", translation: "调查", phonetic: "/ɪnˈvestɪɡeɪt/" },
    ],
  },
  {
    title: "Rising Ocean Temperatures Threaten Coral Reefs Worldwide",
    summary:
      "Scientists warn that warming oceans are causing massive coral bleaching, threatening marine ecosystems and coastal communities around the world.",
    level: "senior",
    category: "news",
    content: `<p>Scientists have issued a new warning about the health of the world's <mark class="vocabulary" data-word="coral">coral</mark> reefs. Rising ocean <mark class="vocabulary" data-word="temperature">temperatures</mark> are causing severe coral bleaching across all major reef systems, threatening the entire marine <mark class="vocabulary" data-word="ecosystem">ecosystem</mark>.</p>
<p>"Coral reefs are like the rainforests of the ocean," explained Dr. Sarah Chen, a marine biologist. "They cover less than 1% of the ocean floor but support over 25% of all marine life." When water temperatures rise by just 1-2 degrees Celsius, corals expel the algae living in their tissues, turning white — a process called bleaching.</p>
<p>The Great Barrier Reef in Australia, the largest living structure on Earth, has experienced five major bleaching events since 2016. Similar damage has been reported in the Caribbean, Southeast Asia, and the Indian Ocean. "If we don't reduce carbon emissions soon, we could lose 90% of the world's coral reefs by 2050," warned Dr. Chen.</p>
<p>Beyond <mark class="vocabulary" data-word="pollution">pollution</mark> and rising temperatures, overfishing and coastal development also threaten reef health. However, some hope remains. Scientists are breeding heat-resistant corals in laboratories and transplanting them to damaged reefs. Local communities are creating protected marine areas.</p>
<p>"Every small action counts," Dr. Chen added. "Reducing plastic use, supporting sustainable fishing, and spreading awareness can all make a difference."</p>`,
    questions: [
      {
        id: 1,
        question: "What percentage of marine life do coral reefs support?",
        options: ["Less than 1%", "About 10%", "Over 25%", "Nearly 50%"],
        answer: "C",
        explanation: "The story says coral reefs 'support over 25% of all marine life.'",
      },
      {
        id: 2,
        question: "What causes coral bleaching?",
        options: [
          "Plastic in the ocean",
          "Rising water temperatures",
          "Too many fish",
          "Ocean storms",
        ],
        answer: "B",
        explanation:
          "The story explains that 'When water temperatures rise by just 1-2 degrees Celsius, corals expel the algae...'",
      },
      {
        id: 3,
        question: "What percentage of coral reefs could disappear by 2050?",
        options: ["50%", "75%", "90%", "100%"],
        answer: "C",
        explanation: "Dr. Chen warned 'we could lose 90% of the world's coral reefs by 2050.'",
      },
      {
        id: 4,
        question: "What are scientists doing to help save coral reefs?",
        options: [
          "Moving all corals to aquariums",
          "Breeding heat-resistant corals in labs",
          "Building walls around reefs",
          "Stopping all fishing worldwide",
        ],
        answer: "B",
        explanation:
          "The story says 'Scientists are breeding heat-resistant corals in laboratories.'",
      },
    ],
    words: [
      { word: "coral", translation: "珊瑚", phonetic: "/ˈkɔːrəl/" },
      { word: "temperature", translation: "温度", phonetic: "/ˈtemprətʃər/" },
      { word: "ecosystem", translation: "生态系统", phonetic: "/ˈiːkoʊsɪstəm/" },
      { word: "pollution", translation: "污染", phonetic: "/pəˈluːʃn/" },
      { word: "sustainable", translation: "可持续的", phonetic: "/səˈsteɪnəbl/" },
    ],
  },
];

// ============================================================
// 写入数据库
// ============================================================

const insertArticle = db.prepare(
  "INSERT INTO articles (title, content, summary, level, category, questions) VALUES (?, ?, ?, ?, ?, ?)",
);
const insertWord = db.prepare(
  "INSERT INTO article_words (article_id, word, translation, phonetic) VALUES (?, ?, ?, ?)",
);

db.exec("BEGIN TRANSACTION");

for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  const result = insertArticle.run(
    a.title,
    a.content,
    a.summary,
    a.level,
    a.category,
    JSON.stringify(a.questions),
  );
  const articleId = Number(result.lastInsertRowid);

  for (const w of a.words) {
    insertWord.run(articleId, w.word, w.translation, w.phonetic);
  }

  console.log(
    `  📄 [${a.level}/${a.category}] "${a.title}" — ${a.questions.length} 题, ${a.words.length} 生词`,
  );
}

db.exec("COMMIT");

const count = db.prepare("SELECT COUNT(*) as c FROM articles").get() as { c: number };
const wordCount = db.prepare("SELECT COUNT(*) as c FROM article_words").get() as { c: number };

console.log(`\n[Article Seed] ✅ 完成！${count.c} 篇文章，${wordCount.c} 个生词标注`);
db.close();

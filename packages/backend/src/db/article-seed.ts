/**
 * 文章测试数据种子脚本
 * 运行方式：npx ts-node --transpile-only src/db/article-seed.ts
 *
 * 数据来源：手动编写 + ESL Yes (eslyes.com) 公开素材改编
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../utils/logger";

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
  logger.info("[Migration] summary 列已添加");
} catch {
  logger.debug("[Migration] summary 列已存在，跳过");
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

  // ========== NEW PRIMARY (小学) ==========
  {
    title: "A Visit to Grandma",
    summary:
      "Emma and her brother Ben spend a wonderful weekend at their grandmother's farm in the countryside.",
    level: "primary",
    category: "story",
    content:
      '<p>Emma and Ben are very excited today. They are going to visit their grandmother in the countryside. Mom packs their bags with clothes, snacks, and a book about animals.</p>\n<p>The car ride takes two hours. Emma looks out the window. She sees green <mark class="vocabulary" data-word="field">fields</mark>, big cows, and pretty white sheep. Ben sleeps most of the way.</p>\n<p>Grandma is waiting at the gate with a big smile. "Welcome, my dears!" she says. She gives them <mark class="vocabulary" data-word="fresh">fresh</mark> cookies from the kitchen. The cookies are warm and taste wonderful.</p>\n<p>In the afternoon, Grandma takes them to the barn. There are two new baby chicks! "They hatched just yesterday," Grandma says. Emma holds one <mark class="vocabulary" data-word="gently">gently</mark> in her hands. It is soft and yellow.</p>\n<p>For dinner, they eat vegetables from Grandma\'s garden. After dinner, they sit by the fireplace. Grandma tells them a story about a brave little rabbit. Emma and Ben fall asleep listening to her <mark class="vocabulary" data-word="voice">voice</mark>.</p>',
    questions: [
      {
        id: 1,
        question: "Where does Grandma live?",
        options: ["In the city", "In the countryside", "By the beach", "In the mountain"],
        answer: "B",
        explanation: "The story says 'visit their grandmother in the countryside.'",
      },
      {
        id: 2,
        question: "What does Grandma give the children when they arrive?",
        options: ["Ice cream", "Fresh cookies", "Apple pie", "Chocolate"],
        answer: "B",
        explanation: "Grandma 'gives them fresh cookies from the kitchen.'",
      },
      {
        id: 3,
        question: "What did the children see in the barn?",
        options: ["A new horse", "Two baby chicks", "A baby cow", "Three kittens"],
        answer: "B",
        explanation: "The story says 'There are two new baby chicks!'",
      },
      {
        id: 4,
        question: "What did they eat for dinner?",
        options: ["Pizza", "Chicken", "Vegetables from Grandma's garden", "Fish"],
        answer: "C",
        explanation: "The story says 'they eat vegetables from Grandma's garden.'",
      },
    ],
    words: [
      { word: "field", translation: "田野", phonetic: "/fiːld/" },
      { word: "fresh", translation: "新鲜的", phonetic: "/freʃ/" },
      { word: "gently", translation: "温柔地；轻轻地", phonetic: "/ˈdʒentli/" },
      { word: "voice", translation: "声音", phonetic: "/vɔɪs/" },
      { word: "barn", translation: "谷仓", phonetic: "/bɑːrn/" },
    ],
  },
  {
    title: "The Zoo Day",
    summary: "Class 2B goes on a field trip to the city zoo and learns about many amazing animals.",
    level: "primary",
    category: "story",
    content:
      '<p>Today is a special day for Class 2B. They are going to the <mark class="vocabulary" data-word="zoo">zoo</mark>! All the children are so happy. They wear their school hats and bring a water bottle.</p>\n<p>The first animal they see is the <mark class="vocabulary" data-word="elephant">elephant</mark>. It is very big! It swings its long nose and sprays water. All the children laugh and clap their hands.</p>\n<p>Next, they visit the <mark class="vocabulary" data-word="monkey">monkeys</mark>. The monkeys jump from tree to tree. They make funny faces. Tim says, "Look! That monkey is eating a banana just like me!"</p>\n<p>At lunchtime, they sit on the grass near the lake. They watch the <mark class="vocabulary" data-word="swan">swans</mark> swim. The swans are white and beautiful. Miss Lee tells them not to feed the animals.</p>\n<p>Before going home, they go to the gift shop. Anna buys a small <mark class="vocabulary" data-word="toy">toy</mark> panda. "This was the best day ever!" she says. Everyone agrees.</p>',
    questions: [
      {
        id: 1,
        question: "What is the first animal the children see?",
        options: ["A monkey", "An elephant", "A lion", "A giraffe"],
        answer: "B",
        explanation: "The story says 'The first animal they see is the elephant.'",
      },
      {
        id: 2,
        question: "What do the monkeys do that makes children laugh?",
        options: ["They dance", "They make funny faces", "They sing a song", "They eat ice cream"],
        answer: "B",
        explanation: "'They make funny faces.'",
      },
      {
        id: 3,
        question: "Where do they eat lunch?",
        options: [
          "In the classroom",
          "On the grass near the lake",
          "Inside a restaurant",
          "Near the elephant",
        ],
        answer: "B",
        explanation: "'they sit on the grass near the lake.'",
      },
      {
        id: 4,
        question: "What does Anna buy at the gift shop?",
        options: ["A toy elephant", "A book", "A toy panda", "A hat"],
        answer: "C",
        explanation: "'Anna buys a small toy panda.'",
      },
    ],
    words: [
      { word: "zoo", translation: "动物园", phonetic: "/zuː/" },
      { word: "elephant", translation: "大象", phonetic: "/ˈelɪfənt/" },
      { word: "monkey", translation: "猴子", phonetic: "/ˈmʌŋki/" },
      { word: "swan", translation: "天鹅", phonetic: "/swɒn/" },
      { word: "toy", translation: "玩具", phonetic: "/tɔɪ/" },
    ],
  },
  {
    title: "Local School Wins Recycling Contest",
    summary:
      "Green Valley Primary School collected over 5,000 bottles and won first prize in the city-wide recycling competition.",
    level: "primary",
    category: "news",
    content:
      '<p>Last Friday, Green Valley Primary School won the city <mark class="vocabulary" data-word="recycle">recycling</mark> competition. The students collected over 5,000 plastic bottles in just one month. "I am so proud of everyone!" said the principal.</p>\n<p>The competition started in September. Every class had a special recycling box. Children brought plastic bottles from home and picked up bottles in the park. The class with the most bottles would win a <mark class="vocabulary" data-word="prize">prize</mark>.</p>\n<p>"It was fun and <mark class="vocabulary" data-word="important">important</mark>," said Kevin, age 9. "We learned that we can help the Earth by doing small things." His class collected 1,200 bottles — the highest in the school.</p>\n<p>Mayor Chen came to the school and gave them a big <mark class="vocabulary" data-word="certificate">certificate</mark>. "Young people like you can change the world," she said. The prize was a new set of books for the school library.</p>\n<p>The students also learned what happens to the bottles. They will be turned into new things like clothes and bags. The school plans to keep recycling and even start a <mark class="vocabulary" data-word="compost">compost</mark> project for food waste.</p>',
    questions: [
      {
        id: 1,
        question: "How many bottles did the school collect?",
        options: ["500", "1,200", "Over 5,000", "10,000"],
        answer: "C",
        explanation: "'students collected over 5,000 plastic bottles.'",
      },
      {
        id: 2,
        question: "What was the prize for winning?",
        options: [
          "A trip to the zoo",
          "New books for the library",
          "A new playground",
          "Free lunch for a year",
        ],
        answer: "B",
        explanation: "The 'prize was a new set of books for the school library.'",
      },
      {
        id: 3,
        question: "Who came to give the certificate?",
        options: ["The principal", "A teacher", "Mayor Chen", "A famous singer"],
        answer: "C",
        explanation: "'Mayor Chen came to the school and gave them a big certificate.'",
      },
      {
        id: 4,
        question: "What will the school start next?",
        options: ["A garden", "A compost project", "A reading club", "A sports team"],
        answer: "B",
        explanation: "The school plans to 'start a compost project for food waste.'",
      },
    ],
    words: [
      { word: "recycle", translation: "回收", phonetic: "/ˌriːˈsaɪkl/" },
      { word: "prize", translation: "奖品", phonetic: "/praɪz/" },
      { word: "important", translation: "重要的", phonetic: "/ɪmˈpɔːrtnt/" },
      { word: "certificate", translation: "证书", phonetic: "/sərˈtɪfɪkət/" },
      { word: "compost", translation: "堆肥", phonetic: "/ˈkɒmpɒst/" },
    ],
  },
  {
    title: "The Little Artist",
    summary:
      "Lily discovers her love for painting and enters her first art contest at the local community center.",
    level: "primary",
    category: "story",
    content:
      '<p>Lily is six years old. She loves to draw. She draws on paper, on the wall, and sometimes on her hands! Her mom says, "Lily, use your <mark class="vocabulary" data-word="sketchbook">sketchbook</mark>, please."</p>\n<p>One day, Lily\'s teacher sees her drawing. "You are very <mark class="vocabulary" data-word="talented">talented</mark>," the teacher says. "There is an art contest at the community center. You should join!" Lily feels nervous but excited.</p>\n<p>Lily decides to paint a picture of her cat, Mittens. She uses many colors. The cat is orange with green eyes. She adds a blue sky and yellow <mark class="vocabulary" data-word="flower">flowers</mark> in the background. It takes her three days to finish.</p>\n<p>On the day of the contest, Lily sees many beautiful paintings. Her heart beats fast. The judge walks around and looks at every painting. Then he <mark class="vocabulary" data-word="announce">announces</mark> the winners.</p>\n<p>"Third place goes to... Lily Chen!" Lily cannot believe it. She runs to get her <mark class="vocabulary" data-word="ribbon">ribbon</mark>. Mom takes a picture. "I knew you could do it," Mom says, hugging her tight.</p>',
    questions: [
      {
        id: 1,
        question: "What does Lily love to do?",
        options: ["Sing", "Dance", "Draw", "Run"],
        answer: "C",
        explanation: "'She loves to draw.'",
      },
      {
        id: 2,
        question: "What did Lily paint for the contest?",
        options: ["A house", "Her cat Mittens", "A rainbow", "Her family"],
        answer: "B",
        explanation: "'decided to paint a picture of her cat, Mittens.'",
      },
      {
        id: 3,
        question: "What place did Lily win?",
        options: ["First place", "Second place", "Third place", "No prize"],
        answer: "C",
        explanation: "The judge said 'Third place goes to... Lily Chen!'",
      },
      {
        id: 4,
        question: "How did Lily feel at the contest at first?",
        options: ["Bored", "Nervous but excited", "Angry", "Sleepy"],
        answer: "B",
        explanation: "'Lily feels nervous but excited.'",
      },
    ],
    words: [
      { word: "sketchbook", translation: "素描本", phonetic: "/ˈsketʃbʊk/" },
      { word: "talented", translation: "有天赋的", phonetic: "/ˈtæləntɪd/" },
      { word: "flower", translation: "花", phonetic: "/ˈflaʊər/" },
      { word: "announce", translation: "宣布", phonetic: "/əˈnaʊns/" },
      { word: "ribbon", translation: "丝带；绶带", phonetic: "/ˈrɪbən/" },
    ],
  },
  {
    title: "Dolphin Rescue Team Saves Stranded Calf",
    summary:
      "Volunteers at Clearwater Beach worked together to rescue a baby dolphin that had been separated from its mother.",
    level: "primary",
    category: "news",
    content:
      '<p>Early Saturday morning, a young dolphin was found stranded on Clearwater Beach. The baby dolphin, called a <mark class="vocabulary" data-word="calf">calf</mark>, was only a few weeks old. It had been separated from its mother near the shore.</p>\n<p>Beachgoers called the local <mark class="vocabulary" data-word="rescue">rescue</mark> team. Volunteers arrived quickly. They wrapped the calf in wet towels to keep it cool. "We had to work fast," said team leader Sarah. "A baby dolphin cannot stay out of water for very long."</p>\n<p>The team carefully carried the calf to a special pool at the marine center. A doctor checked its health. The dolphin was tired but not hurt. Volunteers named him Sunny because he made <mark class="vocabulary" data-word="everyone">everyone</mark> smile.</p>\n<p>Meanwhile, a boat searched the ocean for Sunny\'s mother. After three hours, they found a group of dolphins swimming nearby. The team hoped one was Sunny\'s mom. On Sunday, they brought Sunny back to the <mark class="vocabulary" data-word="ocean">ocean</mark>. As soon as they released him, an adult dolphin swam to Sunny. They touched noses and swam away together.</p>\n<p>"It was a <mark class="vocabulary" data-word="perfect">perfect</mark> ending," said Sarah. "Knowing we helped a tiny life return home is why we do this work."</p>',
    questions: [
      {
        id: 1,
        question: "What is a baby dolphin called?",
        options: ["A pup", "A calf", "A chick", "A cub"],
        answer: "B",
        explanation: "'The baby dolphin, called a calf.'",
      },
      {
        id: 2,
        question: "Why did volunteers wrap the calf in wet towels?",
        options: ["To clean it", "To keep it cool", "To make it sleep", "To hide it from birds"],
        answer: "B",
        explanation: "'wrapped the calf in wet towels to keep it cool.'",
      },
      {
        id: 3,
        question: "What did they name the dolphin?",
        options: ["Lucky", "Sunny", "Happy", "Blue"],
        answer: "B",
        explanation: "'named him Sunny because he made everyone smile.'",
      },
      {
        id: 4,
        question: "How did the rescue end?",
        options: [
          "Sunny stayed at the center",
          "Sunny swam away with his mother",
          "Sunny was sent to another beach",
          "Sunny joined a group of fish",
        ],
        answer: "B",
        explanation: "'they touched noses and swam away together.'",
      },
    ],
    words: [
      { word: "calf", translation: "幼崽", phonetic: "/kæf/" },
      { word: "rescue", translation: "救援", phonetic: "/ˈreskjuː/" },
      { word: "everyone", translation: "每个人", phonetic: "/ˈevriwʌn/" },
      { word: "ocean", translation: "海洋", phonetic: "/ˈoʊʃn/" },
      { word: "perfect", translation: "完美的", phonetic: "/ˈpɜːrfɪkt/" },
    ],
  },

  // ========== NEW JUNIOR (初中) ==========
  {
    title: "The Lost Key",
    summary:
      "When Mia's grandmother gives her a mysterious old key, she embarks on an adventure to uncover a family secret hidden for decades.",
    level: "junior",
    category: "story",
    content:
      '<p>Mia was cleaning her grandmother\'s <mark class="vocabulary" data-word="attic">attic</mark> when she found a small wooden box hidden under an old blanket. Inside the box was a rusty silver key and a faded photograph of a house she had never seen before.</p>\n<p>"Grandma, what is this key for?" Mia asked. Her grandmother\'s eyes grew wide. "I haven\'t seen that in forty years," she said softly. "That key opens the garden shed of our old family home. We had to leave that house <mark class="vocabulary" data-word="suddenly">suddenly</mark> when I was just a girl."</p>\n<p>Grandma explained that during a big storm, the family had to <mark class="vocabulary" data-word="evacuate">evacuate</mark>. They never went back. "I always wondered what we left behind," she said. "There was a diary I kept, full of my childhood dreams."</p>\n<p>The next weekend, Mia and her father drove three hours to the old house. It was abandoned but still standing. With the key in her hand, Mia walked to the garden shed. The lock was old but the key still fit <mark class="vocabulary" data-word="perfectly">perfectly</mark>.</p>\n<p>Inside the dusty shed, Mia found a small metal box. She opened it and discovered her grandmother\'s diary, along with old letters and a gold locket. When Mia brought everything home, Grandma cried happy tears. "You\'ve brought back my <mark class="vocabulary" data-word="memory">memories</mark>," she whispered.</p>',
    questions: [
      {
        id: 1,
        question: "Where did Mia find the wooden box?",
        options: [
          "Under her bed",
          "In the garden",
          "In her grandmother's attic",
          "In the basement",
        ],
        answer: "C",
        explanation:
          "'Mia was cleaning her grandmother's attic when she found a small wooden box.'",
      },
      {
        id: 2,
        question: "What did the key open?",
        options: ["A treasure chest", "A garden shed", "A front door", "A mailbox"],
        answer: "B",
        explanation: "'That key opens the garden shed of our old family home.'",
      },
      {
        id: 3,
        question: "Why did the family leave the old house?",
        options: [
          "They moved to a new city",
          "There was a big storm",
          "The house was sold",
          "They went on vacation",
        ],
        answer: "B",
        explanation: "'during a big storm, the family had to evacuate.'",
      },
      {
        id: 4,
        question: "What did Mia find in the metal box?",
        options: [
          "Money and jewels",
          "A diary, old letters, and a gold locket",
          "Only photographs",
          "An old map",
        ],
        answer: "B",
        explanation: "'her grandmother's diary, along with old letters and a gold locket.'",
      },
    ],
    words: [
      { word: "attic", translation: "阁楼", phonetic: "/ˈætɪk/" },
      { word: "suddenly", translation: "突然地", phonetic: "/ˈsʌdənli/" },
      { word: "evacuate", translation: "撤离；疏散", phonetic: "/ɪˈvækjueɪt/" },
      { word: "perfectly", translation: "完美地", phonetic: "/ˈpɜːrfɪktli/" },
      { word: "memory", translation: "回忆；记忆", phonetic: "/ˈmeməri/" },
    ],
  },
  {
    title: "A Friend from Across the Ocean",
    summary:
      "When a Japanese exchange student arrives at Leo's school, he discovers that friendship can bridge any cultural gap.",
    level: "junior",
    category: "story",
    content:
      '<p>Leo was nervous on the first day of the new term. His teacher announced that a new student from Japan would join their class. "His name is Hiroshi, and he is still learning English," Mrs. Baker said. "Please make him feel <mark class="vocabulary" data-word="welcome">welcome</mark>."</p>\n<p>Hiroshi was quiet and shy. During lunch, he sat alone. Leo remembered how he felt when his family moved to this city two years ago. He knew what it was like to feel like an <mark class="vocabulary" data-word="outsider">outsider</mark>. He walked over and sat down next to Hiroshi.</p>\n<p>"Hi, I\'m Leo. Do you like soccer?" he asked. Hiroshi\'s eyes lit up. "Soccer! Yes!" he said. Although his English was simple, they found a way to <mark class="vocabulary" data-word="communicate">communicate</mark>. They drew pictures on napkins, used hand gestures, and laughed at their mistakes.</p>\n<p>Over the weeks, Leo helped Hiroshi with English, and Hiroshi taught Leo how to do origami. "This is a <mark class="vocabulary" data-word="crane">crane</mark>," Hiroshi explained, folding paper carefully. "In Japan, we believe if you fold a thousand cranes, your wish comes true."</p>\n<p>At the end of the term, the class had a cultural fair. Hiroshi and Leo presented about both American and Japanese traditions together. "The best way to learn about the world," Leo said, "is to make a friend from a different place." Hiroshi smiled and added, "<mark class="vocabulary" data-word="friendship">Friendship</mark> has no borders."</p>',
    questions: [
      {
        id: 1,
        question: "Where did the new student come from?",
        options: ["China", "Japan", "Korea", "India"],
        answer: "B",
        explanation: "'a new student from Japan would join their class.'",
      },
      {
        id: 2,
        question: "Why did Leo go talk to Hiroshi?",
        options: [
          "His teacher told him to",
          "He remembered how it felt to be new",
          "Hiroshi was his neighbor",
          "He wanted to learn Japanese",
        ],
        answer: "B",
        explanation:
          "'He remembered how he felt when his family moved to this city two years ago.'",
      },
      {
        id: 3,
        question: "What did Hiroshi teach Leo?",
        options: ["Cooking", "Origami", "Karate", "Calligraphy"],
        answer: "B",
        explanation: "'Hiroshi taught Leo how to do origami.'",
      },
      {
        id: 4,
        question: "What is the meaning of folding a thousand cranes?",
        options: [
          "It brings good luck",
          "Your wish comes true",
          "You become rich",
          "You find true love",
        ],
        answer: "B",
        explanation: "'if you fold a thousand cranes, your wish comes true.'",
      },
      {
        id: 5,
        question: "What did Hiroshi say about friendship at the cultural fair?",
        options: [
          "Friendship is difficult",
          "Friendship has no borders",
          "Friendship takes time",
          "Friendship needs money",
        ],
        answer: "B",
        explanation: "'Hiroshi smiled and added, \"Friendship has no borders.\"'",
      },
    ],
    words: [
      { word: "welcome", translation: "受欢迎的", phonetic: "/ˈwelkəm/" },
      { word: "outsider", translation: "局外人", phonetic: "/ˌaʊtˈsaɪdər/" },
      { word: "communicate", translation: "交流", phonetic: "/kəˈmjuːnɪkeɪt/" },
      { word: "crane", translation: "鹤；千纸鹤", phonetic: "/kreɪn/" },
      { word: "friendship", translation: "友谊", phonetic: "/ˈfrendʃɪp/" },
    ],
  },
  {
    title: "Teen Coder Creates Free Learning App",
    summary:
      "A 15-year-old programmer from Kenya built an app that helps students in rural areas access free educational materials using basic phones.",
    level: "junior",
    category: "news",
    content:
      '<p>A 15-year-old teenager from Kenya has built a <mark class="vocabulary" data-word="mobile">mobile</mark> app that allows students in rural areas to learn math, science, and English for free. James Omondi, a high school student from a small village, taught himself programming by watching YouTube videos at an internet cafe.</p>\n<p>"In my village, many students don\'t have textbooks or computers," James explained. "But almost every family has at least one phone." His app, called "Study Lite," works on basic phones that don\'t need an internet <mark class="vocabulary" data-word="connection">connection</mark>. It uses very little data and storage.</p>\n<p>The app offers short lessons, simple quizzes, and a <mark class="vocabulary" data-word="dictionary">dictionary</mark>. Teachers in the area helped James write the content. The first version had only math lessons, but now it covers five subjects. Over 10,000 students in three countries have downloaded it.</p>\n<p>Last month, James won the African Youth in Tech award and received a $5,000 grant. He plans to use the money to add more languages and hire <mark class="vocabulary" data-word="translator">translators</mark>. "Education should not depend on where you were born," he said. "<mark class="vocabulary" data-word="technology">Technology</mark> can make it available to everyone."</p>',
    questions: [
      {
        id: 1,
        question: "How did James learn programming?",
        options: ["At school", "From his parents", "By watching YouTube videos", "From a textbook"],
        answer: "C",
        explanation: "'taught himself programming by watching YouTube videos.'",
      },
      {
        id: 2,
        question: "What makes James's app special?",
        options: [
          "It needs fast internet",
          "It works on basic phones without internet",
          "It is only for computers",
          "It costs $100 to download",
        ],
        answer: "B",
        explanation: "'works on basic phones that don't need an internet connection.'",
      },
      {
        id: 3,
        question: "How many students have downloaded the app?",
        options: ["1,000", "5,000", "Over 10,000", "50,000"],
        answer: "C",
        explanation: "'Over 10,000 students in three countries have downloaded it.'",
      },
      {
        id: 4,
        question: "What will James do with the grant money?",
        options: [
          "Buy a new phone",
          "Add more languages and hire translators",
          "Travel to other countries",
          "Build a school",
        ],
        answer: "B",
        explanation: "'He plans to use the money to add more languages and hire translators.'",
      },
    ],
    words: [
      { word: "mobile", translation: "移动的", phonetic: "/ˈmoʊbl/" },
      { word: "connection", translation: "连接", phonetic: "/kəˈnekʃn/" },
      { word: "dictionary", translation: "词典", phonetic: "/ˈdɪkʃəneri/" },
      { word: "translator", translation: "翻译者", phonetic: "/trænzˈleɪtər/" },
      { word: "technology", translation: "技术", phonetic: "/tekˈnɒlədʒi/" },
    ],
  },
  {
    title: "The Marathon Boy",
    summary:
      "Twelve-year-old David, born with a weak leg, proves everyone wrong by finishing a 5K charity run after months of training.",
    level: "junior",
    category: "story",
    content:
      '<p>David was born with a weak left leg. When he was little, doctors said he might never run like other children. But David never stopped <mark class="vocabulary" data-word="believe">believing</mark> in himself.</p>\n<p>Last year, his school announced a charity run to raise money for the children\'s hospital. David decided to join. His classmates were surprised. "Are you sure?" his best friend Carlos asked. David nodded. "I want to try.<mark class="vocabulary" data-word="try">"</mark></p>\n<p>For six months, David trained every morning before school. He ran slowly at first. Some days his leg hurt, and he wanted to give up. But his father ran beside him every day. "One step at a time, son," his father would say. Slowly, David\'s leg grew <mark class="vocabulary" data-word="stronger">stronger</mark>.</p>\n<p>On the day of the run, over 500 people joined. David started at the back. He ran slowly and <mark class="vocabulary" data-word="steadily">steadily</mark>. Many runners passed him, but David kept going. At the finish line, the crowd was waiting. When David crossed, everyone cheered louder than they had for the first-place runner.</p>\n<p>"You don\'t have to be the fastest," David said, catching his breath. "You just have to not give up." He raised $800 for the hospital that day — more than anyone else in his school.</p>',
    questions: [
      {
        id: 1,
        question: "What was David's challenge?",
        options: [
          "He couldn't see well",
          "He was born with a weak leg",
          "He was afraid of crowds",
          "He had a weak heart",
        ],
        answer: "B",
        explanation: "'David was born with a weak left leg.'",
      },
      {
        id: 2,
        question: "How long did David train for the run?",
        options: ["One month", "Three months", "Six months", "One year"],
        answer: "C",
        explanation: "'For six months, David trained every morning before school.'",
      },
      {
        id: 3,
        question: "Who ran with David during training?",
        options: ["His mother", "His father", "His friend Carlos", "His teacher"],
        answer: "B",
        explanation: "'his father ran beside him every day.'",
      },
      {
        id: 4,
        question: "How much money did David raise?",
        options: ["$200", "$500", "$800", "$1,000"],
        answer: "C",
        explanation: "'He raised $800 for the hospital that day.'",
      },
    ],
    words: [
      { word: "believe", translation: "相信", phonetic: "/bɪˈliːv/" },
      { word: "try", translation: "尝试", phonetic: "/traɪ/" },
      { word: "stronger", translation: "更强的", phonetic: "/ˈstrɒŋər/" },
      { word: "steadily", translation: "稳定地", phonetic: "/ˈstedəli/" },
      { word: "charity", translation: "慈善", phonetic: "/ˈtʃærəti/" },
    ],
  },
  {
    title: "NASA Announces First Student Experiment on Mars Mission",
    summary:
      "A high school science club's plant-growth experiment has been selected to fly on the next NASA mission to Mars.",
    level: "junior",
    category: "news",
    content:
      '<p>NASA has chosen a science <mark class="vocabulary" data-word="experiment">experiment</mark> designed by high school students to travel on its next Mars mission. The experiment, created by the Space Club at Lincoln High School in Colorado, will test whether certain plants can grow in Martian soil.</p>\n<p>"We entered the NASA competition just for fun," said club leader Maria Gonzalez, 16. "We never expected to win." The team spent eight months designing a small growing chamber that fits in a shoebox. It uses LED lights and a water recycling system. The <mark class="vocabulary" data-word="chamber">chamber</mark> will be controlled remotely from Earth.</p>\n<p>The winning experiment beat over 800 entries from 45 countries. NASA scientists were impressed by the team\'s creative <mark class="vocabulary" data-word="solution">solution</mark> to the problem of limited space and resources on a spacecraft.</p>\n<p>The Mars mission is scheduled to launch in two years. Maria and her team will watch the launch from mission control. "This is a <mark class="vocabulary" data-word="dream">dream</mark> come true," she said. "We want to show that young people can make a real <mark class="vocabulary" data-word="contribution">contribution</mark> to space exploration."</p>',
    questions: [
      {
        id: 1,
        question: "What will the students' experiment test?",
        options: [
          "If there is water on Mars",
          "If plants can grow in Martian soil",
          "If humans can breathe on Mars",
          "If there are bacteria on Mars",
        ],
        answer: "B",
        explanation: "'test whether certain plants can grow in Martian soil.'",
      },
      {
        id: 2,
        question: "How long did the students work on the experiment?",
        options: ["One month", "Three months", "Six months", "Eight months"],
        answer: "D",
        explanation: "'The team spent eight months designing.'",
      },
      {
        id: 3,
        question: "How many entries did they beat?",
        options: ["100", "400", "Over 800", "Over 2,000"],
        answer: "C",
        explanation: "'beat over 800 entries from 45 countries.'",
      },
      {
        id: 4,
        question: "When will the mission launch?",
        options: ["This year", "In two years", "In five years", "In ten years"],
        answer: "B",
        explanation: "'scheduled to launch in two years.'",
      },
    ],
    words: [
      { word: "experiment", translation: "实验", phonetic: "/ɪkˈsperɪmənt/" },
      { word: "chamber", translation: "舱室", phonetic: "/ˈtʃeɪmbər/" },
      { word: "solution", translation: "解决方案", phonetic: "/səˈluːʃn/" },
      { word: "dream", translation: "梦想", phonetic: "/driːm/" },
      { word: "contribution", translation: "贡献", phonetic: "/ˌkɒntrɪˈbjuːʃn/" },
    ],
  },
  {
    title: "The Night the Lights Went Out",
    summary:
      "A sudden power outage on Emily's street leads to a night of unexpected adventure, storytelling, and a new understanding of her neighbors.",
    level: "junior",
    category: "story",
    content:
      '<p>It was a cold winter evening when all the lights on Maple Street suddenly went out. Emily was doing her homework when her computer screen went black. "Not again," she groaned. Their neighborhood had power problems before, but this time was different.</p>\n<p>Her mom lit candles and a gas <mark class="vocabulary" data-word="lantern">lantern</mark>. Without television or Wi-Fi, the family didn\'t know what to do. "Let\'s go outside and see what\'s happening," Dad suggested. Emily put on her coat and followed.</p>\n<p>Outside, the street looked magical. The snow reflected the moonlight, and the houses stood dark and <mark class="vocabulary" data-word="silent">silent</mark>. Then Emily saw lights flickering at the end of the street. Mr. Johnson, their elderly neighbor, had built a small fire in his backyard and was sitting alone.</p>\n<p>Soon, several families had gathered around the fire. Someone brought marshmallows, someone else brought a guitar. Mrs. Patel told stories about her childhood in India, where power outages were <mark class="vocabulary" data-word="common">common</mark> but people always found ways to enjoy themselves. Mr. Johnson played old songs on his harmonica.</p>\n<p>At 11 PM, the power came back. But strangely, nobody wanted to go inside. "This is the best night we\'ve had in months," Emily\'s mom said. Emily looked around at her <mark class="vocabulary" data-word="neighbors">neighbors</mark>\' faces, lit by the fire, and realized she had never really talked to most of them before. Maybe the blackout wasn\'t such a bad thing after all.</p>',
    questions: [
      {
        id: 1,
        question: "What caused the events of the story?",
        options: ["A big storm", "A power outage", "A fire", "A flood"],
        answer: "B",
        explanation: "'all the lights on Maple Street suddenly went out.'",
      },
      {
        id: 2,
        question: "Who first built the fire?",
        options: ["Emily's dad", "Mr. Johnson", "Mrs. Patel", "Emily"],
        answer: "B",
        explanation: "'Mr. Johnson, their elderly neighbor, had built a small fire.'",
      },
      {
        id: 3,
        question: "What did Mrs. Patel share with everyone?",
        options: [
          "Food from her kitchen",
          "Stories about India",
          "A new movie",
          "Her collection of candles",
        ],
        answer: "B",
        explanation: "'Mrs. Patel told stories about her childhood in India.'",
      },
      {
        id: 4,
        question: "What did Emily realize at the end?",
        options: [
          "She wanted to move away",
          "She had never really talked to most of her neighbors before",
          "She preferred the dark",
          "She missed her computer",
        ],
        answer: "B",
        explanation: "'she realized she had never really talked to most of them before.'",
      },
    ],
    words: [
      { word: "lantern", translation: "灯笼；提灯", phonetic: "/ˈlæntərn/" },
      { word: "silent", translation: "安静的", phonetic: "/ˈsaɪlənt/" },
      { word: "common", translation: "常见的", phonetic: "/ˈkɒmən/" },
      { word: "neighbors", translation: "邻居", phonetic: "/ˈneɪbərz/" },
      { word: "flickering", translation: "闪烁的", phonetic: "/ˈflɪkərɪŋ/" },
    ],
  },
  {
    title: "World's First Plastic-Eating Enzyme Improved by Scientists",
    summary:
      "International team of researchers has engineered a super-enzyme that breaks down plastic bottles six times faster, offering hope for solving plastic pollution.",
    level: "junior",
    category: "news",
    content:
      '<p>Scientists in Britain and the United States have created a "super-enzyme" that can break down plastic bottles six times faster than before. The discovery could offer a powerful new <mark class="vocabulary" data-word="weapon">weapon</mark> in the fight against plastic pollution.</p>\n<p>Plastic takes hundreds of years to break down naturally. Every minute, one million plastic bottles are sold around the world, and most end up in landfills or oceans. The new enzyme, however, can <mark class="vocabulary" data-word="digest">digest</mark> the plastic and turn it back into its original chemical parts.</p>\n<p>"It\'s like taking a Lego house apart back into individual bricks," explained Dr. Sarah Chen, one of the lead researchers. "Those bricks can then be used to build new, high-quality plastic products." This means plastic could be <mark class="vocabulary" data-word="recycled">recycled</mark> endlessly without losing quality.</p>\n<p>The team combined two different enzymes — one that was originally found in bacteria living in a Japanese recycling plant. By linking them together, they created a <mark class="vocabulary" data-word="super">super</mark>-enzyme that works much faster than either one alone.</p>\n<p>"We are still in the early stages," Dr. Chen added. "But the goal is to make this technology available on an <mark class="vocabulary" data-word="industrial">industrial</mark> scale in the next five to ten years. If we succeed, it could fundamentally change how we deal with plastic waste."</p>',
    questions: [
      {
        id: 1,
        question: "How much faster does the new super-enzyme break down plastic?",
        options: ["Two times", "Three times", "Six times", "Ten times"],
        answer: "C",
        explanation: "'six times faster than before.'",
      },
      {
        id: 2,
        question: "How many plastic bottles are sold every minute?",
        options: ["100,000", "500,000", "One million", "Two million"],
        answer: "C",
        explanation: "'Every minute, one million plastic bottles are sold.'",
      },
      {
        id: 3,
        question: "What does Dr. Chen compare the process to?",
        options: [
          "Making a cake",
          "Taking apart a Lego house",
          "Building a bridge",
          "Painting a picture",
        ],
        answer: "B",
        explanation: "'It's like taking a Lego house apart back into individual bricks.'",
      },
      {
        id: 4,
        question: "Where was one of the original enzymes found?",
        options: ["In a forest", "In the ocean", "In a Japanese recycling plant", "In a desert"],
        answer: "C",
        explanation: "'found in bacteria living in a Japanese recycling plant.'",
      },
    ],
    words: [
      { word: "weapon", translation: "武器", phonetic: "/ˈwepən/" },
      { word: "digest", translation: "消化；分解", phonetic: "/daɪˈdʒest/" },
      { word: "recycled", translation: "回收的", phonetic: "/ˌriːˈsaɪkld/" },
      { word: "super", translation: "超级的", phonetic: "/ˈsuːpər/" },
      { word: "industrial", translation: "工业的", phonetic: "/ɪnˈdʌstriəl/" },
    ],
  },

  // ========== NEW SENIOR (高中) ==========
  {
    title: "The Final Speech",
    summary:
      "A shy high school senior must deliver a graduation speech after the original speaker falls ill, confronting her deepest fear of public speaking.",
    level: "senior",
    category: "story",
    content:
      '<p>Olivia had always been the quiet one. In class, she sat in the back row. She never raised her hand, even when she knew the answer. Speaking in front of others made her heart race and her palms sweat. So when the principal called her name — "Olivia, you\'ll be giving the graduation speech" — she felt like the floor had <mark class="vocabulary" data-word="disappeared">disappeared</mark> beneath her.</p>\n<p>The original speaker, the class president, had come down with a bad fever. Olivia was the <mark class="vocabulary" data-word="valedictorian">valedictorian</mark>, the student with the highest grades. By tradition, she was next in line. She wanted to refuse, but her teacher Mrs. Kim pulled her aside. "Olivia, you have earned this. Your voice <mark class="vocabulary" data-word="deserves">deserves</mark> to be heard."</p>\n<p>For two weeks, Olivia wrote and rewrote her speech. She practiced in front of her mirror, in front of her cat, and in front of her mother. Each time, her voice shook. But she kept going. And something strange happened — the more she practiced, the less scared she felt.</p>\n<p>On graduation day, Olivia stood behind the curtain, holding her note cards. Her hands were trembling. Then she remembered something her grandfather used to say: "<mark class="vocabulary" data-word="courage">Courage</mark> is not the absence of fear, but the decision that something else is more important."</p>\n<p>She walked onto the stage. The lights were bright. Hundreds of faces looked up at her. She took a deep breath. "Good afternoon, everyone," she began. Her voice was steady. She spoke about their years together, the challenges they overcame, and the future waiting for them. When she finished, the audience stood up and <mark class="vocabulary" data-word="applauded">applauded</mark>. Olivia walked off the stage knowing she would never be the quiet girl in the back row again.</p>',
    questions: [
      {
        id: 1,
        question: "Why was Olivia chosen to give the graduation speech?",
        options: [
          "She was the most popular student",
          "She was the valedictorian",
          "She volunteered",
          "The principal picked randomly",
        ],
        answer: "B",
        explanation: "'Olivia was the valedictorian, the student with the highest grades.'",
      },
      {
        id: 2,
        question: "Who originally was supposed to give the speech?",
        options: ["The principal", "The class president", "Mrs. Kim", "Olivia's best friend"],
        answer: "B",
        explanation: "'The original speaker, the class president, had come down with a bad fever.'",
      },
      {
        id: 3,
        question: "What did Olivia's grandfather say about courage?",
        options: [
          "Courage means never being afraid",
          "Courage is not the absence of fear",
          "Courage comes from strength",
          "Courage is for soldiers",
        ],
        answer: "B",
        explanation:
          "'Courage is not the absence of fear, but the decision that something else is more important.'",
      },
      {
        id: 4,
        question: "How did the audience react to Olivia's speech?",
        options: [
          "They stayed quiet",
          "They stood up and applauded",
          "They walked out",
          "They started talking",
        ],
        answer: "B",
        explanation: "'the audience stood up and applauded.'",
      },
    ],
    words: [
      { word: "disappeared", translation: "消失", phonetic: "/ˌdɪsəˈpɪrd/" },
      { word: "valedictorian", translation: "毕业致辞代表", phonetic: "/ˌvælɪdɪkˈtɔːriən/" },
      { word: "deserves", translation: "值得；应得", phonetic: "/dɪˈzɜːrvz/" },
      { word: "courage", translation: "勇气", phonetic: "/ˈkɜːrɪdʒ/" },
      { word: "applauded", translation: "鼓掌", phonetic: "/əˈplɔːdɪd/" },
    ],
  },
  {
    title: "The Secret of the Old Lighthouse",
    summary:
      "While on a summer trip to a coastal town, three teenagers discover a hidden message in an abandoned lighthouse that leads them to a century-old treasure.",
    level: "senior",
    category: "story",
    content:
      '<p>The old lighthouse had stood on the cliffs for over a hundred years. Locals said it was haunted, but Jake, Maya, and Aiden didn\'t believe in ghosts. They were more interested in the <mark class="vocabulary" data-word="rumor">rumor</mark> that the lighthouse keeper had hidden something valuable before disappearing in 1923.</p>\n<p>It was the last week of summer vacation, and the three friends had nothing better to do. They climbed the rocky path to the lighthouse, carrying flashlights and a crowbar. The iron door was rusted but not locked. Inside, the air was damp and smelled of salt and old wood.</p>\n<p>They searched for hours. Maya was ready to give up when she noticed something strange — one of the bricks near the fireplace had different <mark class="vocabulary" data-word="carving">carvings</mark> on it. She pushed it, and the brick moved. Behind it was a small compartment with a metal box.</p>\n<p>The box contained a leather-bound journal and a hand-drawn map. The journal belonged to Captain William Hart, the lighthouse keeper. His final entry described a shipment of gold coins that was supposed to arrive by ship but was lost in a storm. Captain Hart had managed to <mark class="vocabulary" data-word="recover">recover</mark> some of the gold and hid it in a cave beneath the lighthouse.</p>\n<p>Following the map, the three friends found a narrow tunnel hidden behind the lighthouse\'s basement wall. It led down to a small cave by the sea. There, buried under a pile of stones, they found a <mark class="vocabulary" data-word="chest">chest</mark> containing 47 gold coins and a letter from Captain Hart.</p>\n<p>The letter read: "To whoever finds this — these coins were meant for the town\'s orphanage. The storm took the ship, but I saved what I could. Please use this treasure to help the children, as I once was." The three friends looked at each other. Sometimes, the real treasure wasn\'t gold — it was the <mark class="vocabulary" data-word="legacy">legacy</mark> of kindness someone left behind.</p>',
    questions: [
      {
        id: 1,
        question: "When did the lighthouse keeper disappear?",
        options: ["1890", "1923", "1945", "1960"],
        answer: "B",
        explanation:
          "'the lighthouse keeper had hidden something valuable before disappearing in 1923.'",
      },
      {
        id: 2,
        question: "Who found the hidden compartment?",
        options: ["Jake", "Maya", "Aiden", "All three together"],
        answer: "B",
        explanation: "'Maya was ready to give up when she noticed something strange.'",
      },
      {
        id: 3,
        question: "What did Captain Hart want the gold to be used for?",
        options: [
          "His family",
          "The town's orphanage",
          "Building a new lighthouse",
          "The government",
        ],
        answer: "B",
        explanation: "'these coins were meant for the town's orphanage.'",
      },
      {
        id: 4,
        question: "What was the 'real treasure' according to the story?",
        options: [
          "The gold coins",
          "The leather journal",
          "The legacy of kindness",
          "The hidden cave",
        ],
        answer: "C",
        explanation:
          "'the real treasure wasn't gold — it was the legacy of kindness someone left behind.'",
      },
    ],
    words: [
      { word: "rumor", translation: "谣言；传闻", phonetic: "/ˈruːmər/" },
      { word: "carving", translation: "雕刻", phonetic: "/ˈkɑːrvɪŋ/" },
      { word: "recover", translation: "找回；恢复", phonetic: "/rɪˈkʌvər/" },
      { word: "chest", translation: "箱子", phonetic: "/tʃest/" },
      { word: "legacy", translation: "遗产；遗留", phonetic: "/ˈleɡəsi/" },
    ],
  },
  {
    title: "Electric Airplane Completes First Cross-Country Flight",
    summary:
      "A fully electric passenger plane has successfully flown 1,500 kilometers across the United States, marking a major milestone in sustainable aviation.",
    level: "senior",
    category: "news",
    content:
      '<p>An all-electric passenger plane has completed the longest flight ever made by a battery-powered aircraft, traveling 1,500 kilometers from Los Angeles to Seattle without using a single drop of fuel. The milestone is being celebrated as a turning point for <mark class="vocabulary" data-word="sustainable">sustainable</mark> aviation.</p>\n<p>The aircraft, named "Albatross One," was developed by a California-based startup called AeroGreen. It carries 19 passengers and runs entirely on high-density lithium-sulfur batteries. The flight lasted just over four hours and produced zero carbon <mark class="vocabulary" data-word="emissions">emissions</mark>.</p>\n<p>"This proves that electric flight is not just a concept for the distant future," said Captain Lisa Park, who piloted the historic journey. "It is happening now." Aviation currently accounts for about 2.5% of global carbon emissions, and the industry has been under increasing pressure to find cleaner solutions.</p>\n<p>However, significant challenges remain. The batteries required for the flight weigh nearly two tons, limiting the aircraft\'s capacity. Recharging takes several hours, which is far longer than <mark class="vocabulary" data-word="refueling">refueling</mark> a traditional plane.</p>\n<p>Experts believe that electric planes will initially serve short- and medium-distance routes — flights under 2,000 kilometers — which account for about half of all air travel. "The technology will improve <mark class="vocabulary" data-word="rapidly">rapidly</mark>," said Dr. James Liu, an aerospace engineer at MIT. "In ten years, I expect electric aircraft to handle most domestic flights."</p>',
    questions: [
      {
        id: 1,
        question: "How far did the electric plane fly?",
        options: ["500 km", "1,000 km", "1,500 km", "2,000 km"],
        answer: "C",
        explanation: "'traveling 1,500 kilometers from Los Angeles to Seattle.'",
      },
      {
        id: 2,
        question: "How many passengers can the aircraft carry?",
        options: ["9", "19", "29", "50"],
        answer: "B",
        explanation: "'It carries 19 passengers.'",
      },
      {
        id: 3,
        question: "What percentage of global carbon emissions comes from aviation?",
        options: ["1%", "2.5%", "5%", "10%"],
        answer: "B",
        explanation: "'about 2.5% of global carbon emissions.'",
      },
      {
        id: 4,
        question: "What routes will electric planes most likely serve first?",
        options: [
          "International flights",
          "Flights under 2,000 km",
          "Flights over oceans",
          "Cargo flights",
        ],
        answer: "B",
        explanation: "'serve short- and medium-distance routes — flights under 2,000 kilometers.'",
      },
    ],
    words: [
      { word: "sustainable", translation: "可持续的", phonetic: "/səˈsteɪnəbl/" },
      { word: "emissions", translation: "排放物", phonetic: "/ɪˈmɪʃnz/" },
      { word: "refueling", translation: "加油", phonetic: "/ˌriːˈfjuːəlɪŋ/" },
      { word: "rapidly", translation: "迅速地", phonetic: "/ˈræpɪdli/" },
      { word: "aviation", translation: "航空", phonetic: "/ˌeɪviˈeɪʃn/" },
    ],
  },
  {
    title: "The Chess Master's Student",
    summary:
      "A retired chess grandmaster reluctantly agrees to train a troubled teenager, and in the process, both of their lives are transformed.",
    level: "senior",
    category: "story",
    content:
      '<p>Mr. Volkov was 72 years old and had not touched a chess piece in five years. After losing the world championship match in 1985, he had retreated from public life. He spent his days in a small apartment, reading old books and <mark class="vocabulary" data-word="ignoring">ignoring</mark> the world outside.</p>\n<p>One afternoon, a social worker knocked on his door with a 15-year-old boy named Daniel. The boy had been in trouble — fighting at school, skipping classes, and running away from home. "He needs something to focus on," the social worker said. "We heard you were once the best chess player in the country."</p>\n<p>Mr. Volkov wanted to say no. But when he looked at Daniel, he saw something familiar — the same anger and <mark class="vocabulary" data-word="restlessness">restlessness</mark> he had felt as a young man growing up in a poor neighborhood. "Come back tomorrow at 4 PM," he said quietly.</p>\n<p>At first, Daniel was <mark class="vocabulary" data-word="impatient">impatient</mark>. He wanted to learn the most complex strategies immediately. But Mr. Volkov made him study the basics for weeks — how pawns move, how to control the center, the importance of patience. "Chess is like life," the old man said. "You cannot skip the hard parts."</p>\n<p>Months passed. Daniel stopped getting into fights. His grades improved. And Mr. Volkov began to smile again. At the city\'s youth chess tournament, Daniel finished third. It wasn\'t first place, but when he looked at Mr. Volkov in the crowd, the old man was <mark class="vocabulary" data-word="applauding">applauding</mark> with tears in his eyes.</p>\n<p>"You taught me chess," Daniel said afterward. "But you also taught me how to be <mark class="vocabulary" data-word="patient">patient</mark>, how to think before acting, and how to lose with dignity." Mr. Volkov placed a hand on the boy\'s shoulder. "And you reminded me that it is never too late to matter to someone."</p>',
    questions: [
      {
        id: 1,
        question: "Why had Mr. Volkov stopped playing chess?",
        options: [
          "He was too old",
          "He lost the world championship",
          "He got sick",
          "He moved to another country",
        ],
        answer: "B",
        explanation:
          "'After losing the world championship match in 1985, he had retreated from public life.'",
      },
      {
        id: 2,
        question: "What did the social worker hope chess would do for Daniel?",
        options: [
          "Make him rich",
          "Give him something to focus on",
          "Get him into college",
          "Teach him math",
        ],
        answer: "B",
        explanation: "'He needs something to focus on.'",
      },
      {
        id: 3,
        question: "What did Mr. Volkov teach Daniel first?",
        options: [
          "Advanced strategies",
          "The basics and patience",
          "How to win quickly",
          "Opening theories",
        ],
        answer: "B",
        explanation: "'Mr. Volkov made him study the basics for weeks.'",
      },
      {
        id: 4,
        question: "What place did Daniel finish in the tournament?",
        options: ["First", "Second", "Third", "Last"],
        answer: "C",
        explanation: "'Daniel finished third.'",
      },
      {
        id: 5,
        question: "What did Daniel say Mr. Volkov taught him besides chess?",
        options: [
          "Math and science",
          "Patience and how to think before acting",
          "How to make friends",
          "How to cook",
        ],
        answer: "B",
        explanation:
          "'you also taught me how to be patient, how to think before acting, and how to lose with dignity.'",
      },
    ],
    words: [
      { word: "ignoring", translation: "忽视", phonetic: "/ɪɡˈnɔːrɪŋ/" },
      { word: "restlessness", translation: "不安；焦躁", phonetic: "/ˈrestləsnəs/" },
      { word: "impatient", translation: "不耐烦的", phonetic: "/ɪmˈpeɪʃnt/" },
      { word: "applauding", translation: "鼓掌", phonetic: "/əˈplɔːdɪŋ/" },
      { word: "patient", translation: "耐心的", phonetic: "/ˈpeɪʃnt/" },
    ],
  },
  {
    title: "Scientists Discover Underground Ocean on Saturn's Moon",
    summary:
      "New data from the Cassini spacecraft reveals a vast liquid water ocean beneath the icy surface of Enceladus, potentially harboring conditions suitable for life.",
    level: "senior",
    category: "news",
    content:
      '<p>Astronomers have confirmed the existence of a global ocean of liquid water beneath the icy crust of Enceladus, one of Saturn\'s moons. The discovery, published in the journal Nature, suggests that the small moon may have the right <mark class="vocabulary" data-word="conditions">conditions</mark> to support microbial life.</p>\n<p>Data from NASA\'s Cassini spacecraft, which spent 13 years studying the Saturn system, revealed that Enceladus has hydrothermal vents on its ocean floor — similar to those found in Earth\'s deep oceans where life thrives without <mark class="vocabulary" data-word="sunlight">sunlight</mark>. The water is kept liquid by heat generated from tidal forces as Saturn\'s gravity pulls on the moon.</p>\n<p>"This is one of the most exciting discoveries in planetary science in decades," said Dr. Amanda Torres, a planetary geologist at NASA\'s Jet Propulsion Laboratory. "We now have <mark class="vocabulary" data-word="convincing">convincing</mark> evidence that Enceladus has a warm, salty ocean in contact with a rocky core. On Earth, those are exactly the conditions where we find life."</p>\n<p>The ocean is believed to be about 10 kilometers deep, buried under 30 to 40 kilometers of ice. Cassini detected organic molecules, carbon dioxide, and hydrogen in plumes of water vapor erupting from cracks in the ice — all <mark class="vocabulary" data-word="ingredients">ingredients</mark> that could support simple organisms.</p>\n<p>NASA is now planning a follow-up mission, tentatively named "Enceladus Life Finder," that would fly through the plumes and analyze their content at a much higher resolution. The mission could launch as early as 2035. "We are <mark class="vocabulary" data-word="cautiously">cautiously</mark> optimistic," Dr. Torres said. "If life exists elsewhere in our solar system, Enceladus is now the most promising place to look."</p>',
    questions: [
      {
        id: 1,
        question: "What did Cassini discover on Enceladus?",
        options: [
          "A new continent",
          "A global ocean under the ice",
          "Active volcanoes",
          "Life forms",
        ],
        answer: "B",
        explanation:
          "'confirmed the existence of a global ocean of liquid water beneath the icy crust.'",
      },
      {
        id: 2,
        question: "What keeps the ocean liquid?",
        options: [
          "The sun's heat",
          "Heat from tidal forces",
          "Chemical reactions",
          "Nuclear energy",
        ],
        answer: "B",
        explanation: "'water is kept liquid by heat generated from tidal forces.'",
      },
      {
        id: 3,
        question: "What did Cassini detect in the water plumes?",
        options: [
          "Only water",
          "Organic molecules, CO2, and hydrogen",
          "Fish and plants",
          "Metal deposits",
        ],
        answer: "B",
        explanation: "'detected organic molecules, carbon dioxide, and hydrogen in plumes.'",
      },
      {
        id: 4,
        question: "What is the follow-up mission called?",
        options: ["Mars Explorer", "Enceladus Life Finder", "Saturn Voyager", "Ocean Hunter"],
        answer: "B",
        explanation: "'planning a follow-up mission, tentatively named \"Enceladus Life Finder.\"'",
      },
    ],
    words: [
      { word: "conditions", translation: "条件；环境", phonetic: "/kənˈdɪʃnz/" },
      { word: "sunlight", translation: "阳光", phonetic: "/ˈsʌnlaɪt/" },
      { word: "convincing", translation: "有说服力的", phonetic: "/kənˈvɪnsɪŋ/" },
      { word: "ingredients", translation: "成分；原料", phonetic: "/ɪnˈɡriːdiənts/" },
      { word: "cautiously", translation: "谨慎地", phonetic: "/ˈkɔːʃəsli/" },
    ],
  },
  {
    title: "The Photograph in the Attic",
    summary:
      "While packing for college, Sophie discovers an old photograph that reveals her grandmother's hidden past as a freedom fighter.",
    level: "senior",
    category: "story",
    content:
      '<p>The summer before college, Sophie\'s mother asked her to clean out the attic. "You\'ll find things you never knew existed," her mom said with a mysterious smile. Sophie expected dust and old furniture, not a <mark class="vocabulary" data-word="discovery">discovery</mark> that would change how she saw her family forever.</p>\n<p>At the bottom of a wooden trunk, she found a black-and-white photograph of a young woman standing in front of a crowd, holding a sign that read "Freedom and Justice." The woman looked familiar but much younger — it was her grandmother, who had passed away when Sophie was seven. Sophie had only known her as a gentle woman who baked cookies and knitted sweaters.</p>\n<p>She ran downstairs. "Mom, was Grandma a <mark class="vocabulary" data-word="protester">protester</mark>?" Her mother sighed and sat down. "Your grandmother was part of the civil rights movement in the 1960s. She marched, she organized, and she was arrested twice for sitting at a lunch counter that refused to serve Black people."</p>\n<p>Sophie couldn\'t believe it. "Why did nobody ever tell me?" Her mother explained that after the movement, Grandma chose a quiet life. She wanted her children and grandchildren to grow up without the burden of her past. "But she always said that courage isn\'t about being <mark class="vocabulary" data-word="fearless">fearless</mark>," her mom added. "It\'s about standing up for what\'s right even when you are afraid."</p>\n<p>That fall, Sophie started college with a new sense of purpose. She joined the student <mark class="vocabulary" data-word="activist">activist</mark> group and hung her grandmother\'s photograph on her dorm wall. Every time she walked past it, she felt a connection to a woman she was just beginning to understand. "I carry her <mark class="vocabulary" data-word="spirit">spirit</mark> with me now," Sophie wrote in her journal. "And I finally understand what she fought for."</p>',
    questions: [
      {
        id: 1,
        question: "Where did Sophie find the photograph?",
        options: ["In her bedroom", "In the attic", "At school", "At her grandmother's house"],
        answer: "B",
        explanation: "'At the bottom of a wooden trunk' in the attic.",
      },
      {
        id: 2,
        question: "What movement was Sophie's grandmother part of?",
        options: [
          "The environmental movement",
          "The civil rights movement",
          "The women's rights movement",
          "The labor movement",
        ],
        answer: "B",
        explanation: "'Your grandmother was part of the civil rights movement in the 1960s.'",
      },
      {
        id: 3,
        question: "What did Sophie's grandmother say about courage?",
        options: [
          "Courage means never being scared",
          "Courage is standing up for what's right when you are afraid",
          "Courage is about physical strength",
          "Courage is something you're born with",
        ],
        answer: "B",
        explanation:
          "'courage isn't about being fearless... It's about standing up for what's right even when you are afraid.'",
      },
      {
        id: 4,
        question: "What did Sophie do when she started college?",
        options: [
          "She studied history",
          "She joined the student activist group",
          "She became a teacher",
          "She wrote a book",
        ],
        answer: "B",
        explanation: "'She joined the student activist group.'",
      },
    ],
    words: [
      { word: "discovery", translation: "发现", phonetic: "/dɪˈskʌvəri/" },
      { word: "protester", translation: "抗议者", phonetic: "/prəˈtestər/" },
      { word: "fearless", translation: "无畏的", phonetic: "/ˈfɪrləs/" },
      { word: "activist", translation: "活动家；积极分子", phonetic: "/ˈæktɪvɪst/" },
      { word: "spirit", translation: "精神", phonetic: "/ˈspɪrɪt/" },
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

  logger.info(
    `  [${a.level}/${a.category}] "${a.title}" — ${a.questions.length} 题, ${a.words.length} 生词`,
  );
}

db.exec("COMMIT");

const count = db.prepare("SELECT COUNT(*) as c FROM articles").get() as { c: number };
const wordCount = db.prepare("SELECT COUNT(*) as c FROM article_words").get() as { c: number };

logger.info(`[Article Seed] 完成！${count.c} 篇文章，${wordCount.c} 个生词标注`);
db.close();

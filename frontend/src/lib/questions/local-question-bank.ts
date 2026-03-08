import { hash } from 'starknet'
import type { AppLanguage } from '../../store/app-settings-store'
import type { TriviaDifficulty } from '../trivia-engine'

type DifficultyLevel = 0 | 1 | 2

type OptionIndex = 0 | 1 | 2 | 3

type QuestionCopy = {
  options: [string, string, string, string]
  prompt: string
}

type CanonicalQuestionRecord = {
  id: string
  index: number
  category: number
  difficulty: DifficultyLevel
  correctOption: OptionIndex
  en: QuestionCopy
  es: QuestionCopy
}

type LocalQuestionSeed = {
  category: number
  correctOption: OptionIndex
  difficulty: DifficultyLevel
  id: string
  index: number
}

type MerkleArtifacts = {
  merkleDirections: Array<0 | 1>
  merkleProof: string[]
}

export type HydratedQuestion = LocalQuestionSeed &
  MerkleArtifacts & {
    canonicalToDisplay: [OptionIndex, OptionIndex, OptionIndex, OptionIndex]
    displayCorrectOption: OptionIndex
    displayOptions: [string, string, string, string]
    displayPrompt: string
    displayToCanonical: [OptionIndex, OptionIndex, OptionIndex, OptionIndex]
  }

const CANONICAL_QUESTIONS: CanonicalQuestionRecord[] = [
  {
    id: "legacy-001",
    index: 0,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Argentina?",
      options: ["Buenos Aires", "Cordoba", "Lima", "Bogota"],
    },
    es: {
      prompt: "¿Cuál es la capital de Argentina?",
      options: ["Buenos Aires", "Córdoba", "Lima", "Bogotá"],
    },
  },
  {
    id: "legacy-002",
    index: 1,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of France?",
      options: ["Paris", "Rome", "Lisbon", "Berlin"],
    },
    es: {
      prompt: "¿Cuál es la capital de Francia?",
      options: ["París", "Roma", "Lisboa", "Berlín"],
    },
  },
  {
    id: "legacy-003",
    index: 2,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Japan?",
      options: ["Tokyo", "Seoul", "Beijing", "Bangkok"],
    },
    es: {
      prompt: "¿Cuál es la capital de Japón?",
      options: ["Tokio", "Seúl", "Pekín", "Bangkok"],
    },
  },
  {
    id: "legacy-004",
    index: 3,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Brazil?",
      options: ["Brasilia", "Rio de Janeiro", "Sao Paulo", "Montevideo"],
    },
    es: {
      prompt: "¿Cuál es la capital de Brasil?",
      options: ["Brasilia", "Rio de Janeiro", "São Paulo", "Montevideo"],
    },
  },
  {
    id: "legacy-005",
    index: 4,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Mexico?",
      options: ["Mexico City", "Cancun", "Guadalajara", "Quito"],
    },
    es: {
      prompt: "¿Cuál es la capital de México?",
      options: ["Ciudad de México", "Cancún", "Guadalajara", "Quito"],
    },
  },
  {
    id: "legacy-006",
    index: 5,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Colombia?",
      options: ["Bogota", "Medellin", "Quito", "Caracas"],
    },
    es: {
      prompt: "¿Cuál es la capital de Colombia?",
      options: ["Bogotá", "Medellín", "Quito", "Caracas"],
    },
  },
  {
    id: "legacy-007",
    index: 6,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which planet is known as the Red Planet?",
      options: ["Mars", "Venus", "Neptune", "Mercury"],
    },
    es: {
      prompt: "¿Qué planeta es conocido como el planeta rojo?",
      options: ["Marte", "Venus", "Neptuno", "Mercurio"],
    },
  },
  {
    id: "legacy-008",
    index: 7,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which planet is famous for its rings?",
      options: ["Saturn", "Jupiter", "Mercury", "Earth"],
    },
    es: {
      prompt: "¿Qué planeta es famoso por sus anillos?",
      options: ["Saturno", "Júpiter", "Mercurio", "Tierra"],
    },
  },
  {
    id: "legacy-009",
    index: 8,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which planet is closest to the Sun?",
      options: ["Mercury", "Venus", "Mars", "Jupiter"],
    },
    es: {
      prompt: "¿Cuál es el planeta más cercaño al Sol?",
      options: ["Mercurio", "Venus", "Marte", "Júpiter"],
    },
  },
  {
    id: "legacy-010",
    index: 9,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which planet is the largest in the solar system?",
      options: ["Jupiter", "Mars", "Saturn", "Uranus"],
    },
    es: {
      prompt: "¿Cuál es el planeta más grande del sistema solar?",
      options: ["Júpiter", "Marte", "Saturno", "Urano"],
    },
  },
  {
    id: "legacy-011",
    index: 10,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which ocean is the largest on Earth?",
      options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"],
    },
    es: {
      prompt: "¿Cuál es el océaño más grande de la Tierra?",
      options: ["Océaño Pacífico", "Océaño Atlántico", "Océaño Índico", "Océaño Ártico"],
    },
  },
  {
    id: "legacy-012",
    index: 11,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "In which continent is the Sahara Desert located?",
      options: ["Africa", "Asia", "Oceania", "America"],
    },
    es: {
      prompt: "¿En qué continente esta el desierto del Sahara?",
      options: ["África", "Asia", "Oceanía", "América"],
    },
  },
  {
    id: "legacy-013",
    index: 12,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Mount Aconcagua belongs to which mountain range?",
      options: ["Andes", "Alps", "Himalayas", "Rockies"],
    },
    es: {
      prompt: "¿En qué cordillera esta el Aconcagua?",
      options: ["Andes", "Alpes", "Himalaya", "Rocosas"],
    },
  },
  {
    id: "legacy-014",
    index: 13,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which imaginary line divides Earth into the Northern and Southern Hemispheres?",
      options: ["Equator", "Prime Meridian", "Tropic of Cancer", "Arctic Circle"],
    },
    es: {
      prompt: "¿Qué linea imaginaria divide la Tierra en hemisferío norte y sur?",
      options: ["Ecuador", "Meridiaño de Greenwich", "Trópico de Cáncer", "Círculo Polar"],
    },
  },
  {
    id: "legacy-015",
    index: 14,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which sea separates Europe from North Africa?",
      options: ["Mediterranean Sea", "Baltic Sea", "Caspian Sea", "Red Sea"],
    },
    es: {
      prompt: "¿Qué mar separa Europa del norte de África?",
      options: ["Mar Mediterráneo", "Mar Báltico", "Mar Caspio", "Mar Rojo"],
    },
  },
  {
    id: "legacy-016",
    index: 15,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the highest mountain in the world above sea level?",
      options: ["Everest", "K2", "Aconcagua", "Kilimanjaro"],
    },
    es: {
      prompt: "¿Cuál es la montana más alta del mundo sobre el nivel del mar?",
      options: ["Everest", "K2", "Aconcagua", "Kilimanjaro"],
    },
  },
  {
    id: "legacy-017",
    index: 16,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What gas do plants absorb during photosynthesis?",
      options: ["Carbon dioxide", "Oxygen", "Helium", "Nitrogen"],
    },
    es: {
      prompt: "¿Qué gas absorben las plantas durante la fotosíntesis?",
      options: ["Dióxido de carbono", "Oxígeno", "Helio", "Nitrógeno"],
    },
  },
  {
    id: "legacy-018",
    index: 17,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the chemical formula for water?",
      options: ["H2O", "CO2", "O2", "NaCl"],
    },
    es: {
      prompt: "¿Cuál es la formula del agua?",
      options: ["H2O", "CO2", "O2", "NaCl"],
    },
  },
  {
    id: "legacy-019",
    index: 18,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which organ pumps blood through the human body?",
      options: ["Heart", "Liver", "Lung", "Pancreas"],
    },
    es: {
      prompt: "¿Qué orgaño bombea la sangre por todo el cuerpo?",
      options: ["Corazón", "Hígado", "Pulmón", "Páncreas"],
    },
  },
  {
    id: "legacy-020",
    index: 19,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the chemical symbol for sodium?",
      options: ["Na", "So", "Sn", "Sd"],
    },
    es: {
      prompt: "¿Cuál es el símbolo químico del sodio?",
      options: ["Na", "So", "Sn", "Sd"],
    },
  },
  {
    id: "legacy-021",
    index: 20,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which molecule stores genetic information?",
      options: ["DNA", "ATP", "RNA", "Chlorophyll"],
    },
    es: {
      prompt: "¿Qué molécula almacena la información genetica?",
      options: ["ADN", "ATP", "ARN", "Clorofila"],
    },
  },
  {
    id: "legacy-022",
    index: 21,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "In which organelle does photosynthesis occur?",
      options: ["Chloroplast", "Nucleus", "Mitochondrion", "Vacuole"],
    },
    es: {
      prompt: "¿En qué orgánulo ocurre la fotosíntesis?",
      options: ["Cloroplasto", "Núcleo", "Mitocondria", "Vacuola"],
    },
  },
  {
    id: "legacy-023",
    index: 22,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the basic unit of living beings?",
      options: ["Cell", "Atom", "Tissue", "Organ"],
    },
    es: {
      prompt: "¿Cuál es la unidad básica de los seres vivos?",
      options: ["Célula", "Átomo", "Tejido", "Orgaño"],
    },
  },
  {
    id: "legacy-024",
    index: 23,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which organelle produces most of a cell's energy?",
      options: ["Mitochondrion", "Ribosome", "Lysosome", "Golgi apparatus"],
    },
    es: {
      prompt: "¿Qué orgánulo produce gran parte de la energía celular?",
      options: ["Mitocondria", "Ribosoma", "Lisosoma", "Aparato de Golgi"],
    },
  },
  {
    id: "legacy-025",
    index: 24,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which blood component mainly carries oxygen?",
      options: ["Red blood cells", "Platelets", "Plasma", "White blood cells"],
    },
    es: {
      prompt: "¿Qué componente de la sangre transporta principalmente oxígeno?",
      options: ["Glóbulos rojos", "Plaquetas", "Plasma", "Glóbulos blancos"],
    },
  },
  {
    id: "legacy-026",
    index: 25,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the fastest land animal?",
      options: ["Cheetah", "Lion", "Horse", "Wolf"],
    },
    es: {
      prompt: "¿Cuál es el animal terrestre más rapido?",
      options: ["Guepardo", "León", "Caballo", "Lobo"],
    },
  },
  {
    id: "legacy-027",
    index: 26,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the largest mammal in the world?",
      options: ["Blue whale", "Elephant", "Giraffe", "Hippopotamus"],
    },
    es: {
      prompt: "¿Cuál es el mamifero más grande del mundo?",
      options: ["Ballena azul", "Elefante", "Jirafa", "Hipopotamo"],
    },
  },
  {
    id: "legacy-028",
    index: 27,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "How many legs does a spider have?",
      options: ["8", "6", "10", "12"],
    },
    es: {
      prompt: "¿Cuántas patas tiene una araña?",
      options: ["8", "6", "10", "12"],
    },
  },
  {
    id: "legacy-029",
    index: 28,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "How many sides does a triangle have?",
      options: ["3", "4", "5", "6"],
    },
    es: {
      prompt: "¿Cuántos lados tiene un triángulo?",
      options: ["3", "4", "5", "6"],
    },
  },
  {
    id: "legacy-030",
    index: 29,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "How many units are in a dozen?",
      options: ["12", "10", "6", "20"],
    },
    es: {
      prompt: "¿Cuánto es una docena?",
      options: ["12", "10", "6", "20"],
    },
  },
  {
    id: "legacy-031",
    index: 30,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the exact square root of 144?",
      options: ["12", "14", "16", "18"],
    },
    es: {
      prompt: "¿Cuál es la raíz cuadrada exacta de 144?",
      options: ["12", "14", "16", "18"],
    },
  },
  {
    id: "legacy-032",
    index: 31,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What decimal value does the binary number 1010 represent?",
      options: ["10", "8", "12", "14"],
    },
    es: {
      prompt: "¿Qué valor decimal tiene el número binarío 1010?",
      options: ["10", "8", "12", "14"],
    },
  },
  {
    id: "legacy-033",
    index: 32,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which of these numbers is prime?",
      options: ["29", "21", "27", "33"],
    },
    es: {
      prompt: "¿Cuál de estos números es primo?",
      options: ["29", "21", "27", "33"],
    },
  },
  {
    id: "legacy-034",
    index: 33,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which constant represents the ratio between a circle's circumference and diameter?",
      options: ["Pi", "Euler", "Phi", "Sigma"],
    },
    es: {
      prompt: "¿Qué constante representa la relación entre circunferencia y diámetro?",
      options: ["Pi", "Euler", "Phi", "Sigma"],
    },
  },
  {
    id: "legacy-035",
    index: 34,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "How much do the interior angles of a triangle add up to?",
      options: ["180 degrees", "90 degrees", "270 degrees", "360 degrees"],
    },
    es: {
      prompt: "¿Cuánto suman los ángulos interíores de un triángulo?",
      options: ["180 grados", "90 grados", "270 grados", "360 grados"],
    },
  },
  {
    id: "legacy-036",
    index: 35,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "In what year did humans first land on the Moon?",
      options: ["1969", "1959", "1975", "1981"],
    },
    es: {
      prompt: "¿En qué año llego el ser humaño a la Luna?",
      options: ["1969", "1959", "1975", "1981"],
    },
  },
  {
    id: "legacy-037",
    index: 36,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which river was essential to ancient Egyptian civilization?",
      options: ["Nile", "Amazon", "Danube", "Mississippi"],
    },
    es: {
      prompt: "¿Qué río fue clave para el antiguo Egipto?",
      options: ["Nilo", "Amazonas", "Danubio", "Misisipi"],
    },
  },
  {
    id: "legacy-038",
    index: 37,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What was the great city of the Mexica empire?",
      options: ["Tenochtitlan", "Cusco", "Machu Picchu", "Chichen Itza"],
    },
    es: {
      prompt: "¿Cuál era la gran ciudad del imperío mexica?",
      options: ["Tenochtitlan", "Cusco", "Machu Picchu", "Chichen Itza"],
    },
  },
  {
    id: "legacy-039",
    index: 38,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What language was mainly spoken by the ancient Romans?",
      options: ["Latin", "Greek", "Arabic", "French"],
    },
    es: {
      prompt: "¿Qué idioma hablaban principalmente los romaños?",
      options: ["Latin", "Griego", "Árabe", "Francés"],
    },
  },
  {
    id: "legacy-040",
    index: 39,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "In what year did the Berlin Wall fall?",
      options: ["1989", "1979", "1995", "1961"],
    },
    es: {
      prompt: "¿En qué año cayó el Muro de Berlín?",
      options: ["1989", "1979", "1995", "1961"],
    },
  },
  {
    id: "legacy-041",
    index: 40,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "In which country did the European Renaissance begin?",
      options: ["Italy", "France", "Germany", "Portugal"],
    },
    es: {
      prompt: "¿En qué pais comenzo el Renacimiento europeo?",
      options: ["Italia", "Francia", "Alemania", "Portugal"],
    },
  },
  {
    id: "legacy-042",
    index: 41,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who wrote Don Quixote?",
      options: ["Miguel de Cervantes", "Gabriel Garcia Marquez", "Pablo Neruda", "Lope de Vega"],
    },
    es: {
      prompt: "¿Quién escribio Don Quijote de la Mancha?",
      options: ["Miguel de Cervantes", "Gabriel Garcia Marquez", "Pablo Neruda", "Lope de Vega"],
    },
  },
  {
    id: "legacy-043",
    index: 42,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who wrote Romeo and Juliet?",
      options: ["William Shakespeare", "Charles Dickens", "Moliere", "Jules Verne"],
    },
    es: {
      prompt: "¿Quién escribio Romeo y Julieta?",
      options: ["William Shakespeare", "Charles Dickens", "Moliere", "Jules Verne"],
    },
  },
  {
    id: "legacy-044",
    index: 43,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who painted the Mona Lisa?",
      options: ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Claude Monet"],
    },
    es: {
      prompt: "¿Quién pintó la Mona Lisa?",
      options: ["Leónardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Claude Monet"],
    },
  },
  {
    id: "legacy-045",
    index: 44,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who painted Guernica?",
      options: ["Pablo Picasso", "Salvador Dali", "Diego Velazquez", "Joan Miro"],
    },
    es: {
      prompt: "¿Quién pintó Guernica?",
      options: ["Pablo Picasso", "Salvador Dali", "Diego Velazquez", "Joan Miro"],
    },
  },
  {
    id: "legacy-046",
    index: 45,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who is traditionally credited as the author of The Odyssey?",
      options: ["Homer", "Plato", "Aristotle", "Socrates"],
    },
    es: {
      prompt: "¿Quién es el autor atribuido de La Odisea?",
      options: ["Homero", "Platón", "Aristóteles", "Sócrates"],
    },
  },
  {
    id: "legacy-047",
    index: 46,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which sport uses a hoop to score points?",
      options: ["Basketball", "Baseball", "Tennis", "Golf"],
    },
    es: {
      prompt: "¿En qué deporte se usa una canasta?",
      options: ["Baloncesto", "Beisbol", "Tenis", "Golf"],
    },
  },
  {
    id: "legacy-048",
    index: 47,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "In which sport do players mainly use their feet to pass the ball?",
      options: ["Football", "Handball", "Water polo", "Volleyball"],
    },
    es: {
      prompt: "¿En qué deporte se usa principalmente el pie para pasar la pelota?",
      options: ["Fútbol", "Balonmaño", "Waterpolo", "Voleibol"],
    },
  },
  {
    id: "legacy-049",
    index: 48,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which markup language is used to structure web content?",
      options: ["HTML", "CSS", "SQL", "Photoshop"],
    },
    es: {
      prompt: "¿Qué lenguaje se usa para estructurar contenido web?",
      options: ["HTML", "CSS", "SQL", "Photoshop"],
    },
  },
  {
    id: "legacy-050",
    index: 49,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which technology is mainly used for visual styling on a web page?",
      options: ["CSS", "Python", "Git", "Docker"],
    },
    es: {
      prompt: "¿Qué tecnología se usa principalmente para estilos visuales en una pagina web?",
      options: ["CSS", "Python", "Git", "Docker"],
    },
  },
  {
    id: "legacy-051",
    index: 50,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which tool is commonly used for version control?",
      options: ["Git", "Figma", "Blender", "Excel"],
    },
    es: {
      prompt: "¿Qué herramienta se usa para control de versiones?",
      options: ["Git", "Figma", "Blender", "Excel"],
    },
  },
  {
    id: "legacy-052",
    index: 51,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What do we call an ordered set of steps to solve a problem?",
      options: ["Algorithm", "Pixel", "Cache", "Kernel"],
    },
    es: {
      prompt: "¿Cómo se llama un conjunto ordenado de pasos para resolver un problema?",
      options: ["Algoritmo", "Pixel", "Cache", "Kernel"],
    },
  },
  {
    id: "legacy-053",
    index: 52,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "In which galaxy is the solar system located?",
      options: ["Milky Way", "Andromeda", "Sombrero", "Magellanic Clouds"],
    },
    es: {
      prompt: "¿En qué galaxia se encuentra el sistema solar?",
      options: ["Vía Láctea", "Andromeda", "Sombrero", "Nubes de Magallanes"],
    },
  },
  {
    id: "legacy-054",
    index: 53,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What is the Sun?",
      options: ["A star", "A planet", "A satellite", "An asteroid"],
    },
    es: {
      prompt: "¿Qué es el Sol?",
      options: ["Una estrella", "Un planeta", "Un satélite", "Un asteroide"],
    },
  },
  {
    id: "legacy-055",
    index: 54,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which planet is farthest from the Sun?",
      options: ["Neptune", "Saturn", "Uranus", "Jupiter"],
    },
    es: {
      prompt: "¿Qué planeta esta más lejos del Sol?",
      options: ["Neptuno", "Saturno", "Urano", "Júpiter"],
    },
  },
  {
    id: "legacy-056",
    index: 55,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What do we call a region in space whose gravity is so strong that even light cannot escape?",
      options: ["Black hole", "Nebula", "Comet", "Supernova"],
    },
    es: {
      prompt: "¿Cómo se llama una región del espacio con gravedad tan intensa que ni la luz escapa?",
      options: ["Agujero negro", "Nebulosa", "Cometa", "Supernova"],
    },
  },
  {
    id: "legacy-057",
    index: 56,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "How many continents are recognized in the seven-continent model?",
      options: ["7", "6", "5", "8"],
    },
    es: {
      prompt: "¿Cuántos continentes se reconocen en el modelo de siete continentes?",
      options: ["7", "6", "5", "8"],
    },
  },
  {
    id: "legacy-058",
    index: 57,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which country belongs to Oceania?",
      options: ["New Zealand", "Chile", "Peru", "Morocco"],
    },
    es: {
      prompt: "¿Cuál de estos países pertenece a Oceanía?",
      options: ["Nueva Zelanda", "Chile", "Peru", "Marruecos"],
    },
  },
  {
    id: "legacy-059",
    index: 58,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What color do you get when you mix blue and yellow?",
      options: ["Green", "Red", "Purple", "Orange"],
    },
    es: {
      prompt: "¿Qué color aparece al mezclar azul y amarillo?",
      options: ["Verde", "Rojo", "Morado", "Naranja"],
    },
  },
  {
    id: "legacy-060",
    index: 59,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which famous trade route connected Asia and Europe?",
      options: ["Silk Road", "Inca Trail", "Appian Way", "Gold Route"],
    },
    es: {
      prompt: "¿Cómo se llamaba la gran ruta comercial entre Asia y Europa?",
      options: ["Ruta de la Seda", "Camino Inca", "Via Apia", "Ruta del Oro"],
    },
  },
  {
    id: "legacy-061",
    index: 60,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which scientist is associated with the movable-type printing press in Europe?",
      options: ["Johannes Gutenberg", "Isaac Newton", "Leonardo da Vinci", "Galileo Galilei"],
    },
    es: {
      prompt: "¿Quién es asociado con la imprenta de tipos móviles en Europa?",
      options: ["Johannes Gutenberg", "Isaac Newton", "Leónardo da Vinci", "Galileo Galilei"],
    },
  },
  {
    id: "legacy-062",
    index: 61,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which relative positions explain the phases of the Moon seen from Earth?",
      options: ["Sun-Earth-Moon positions", "Mars shadow", "Solar wind", "Jupiter rotation"],
    },
    es: {
      prompt: "¿Qué posiciones relativas explican las fases de la Luna vistas desde la Tierra?",
      options: ["Posiciones Sol-Tierra-Luna", "Sombra de Marte", "Viento solar", "Rotación de Júpiter"],
    },
  },
  {
    id: "legacy-063",
    index: 62,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which country declared independence in 1776?",
      options: ["United States", "Mexico", "France", "Brazil"],
    },
    es: {
      prompt: "¿Qué pais declaro su independencia en 1776?",
      options: ["Estados Unidos", "México", "Francia", "Brasil"],
    },
  },
  {
    id: "easy-capital-canada",
    index: 63,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Canada?",
      options: ["Ottawa", "Toronto", "Vancouver", "Montreal"],
    },
    es: {
      prompt: "¿Cuál es la capital de Canadá?",
      options: ["Ottawa", "Toronto", "Vancouver", "Montreal"],
    },
  },
  {
    id: "easy-capital-australia",
    index: 64,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Australia?",
      options: ["Canberra", "Sydney", "Melbourne", "Perth"],
    },
    es: {
      prompt: "¿Cuál es la capital de Australia?",
      options: ["Canberra", "Sídney", "Melbourne", "Perth"],
    },
  },
  {
    id: "easy-capital-peru",
    index: 65,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Peru?",
      options: ["Lima", "Cusco", "Arequipa", "La Paz"],
    },
    es: {
      prompt: "¿Cuál es la capital de Perú?",
      options: ["Lima", "Cusco", "Arequipa", "La Paz"],
    },
  },
  {
    id: "easy-capital-chile",
    index: 66,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Chile?",
      options: ["Santiago", "Valparaiso", "Concepcion", "Lima"],
    },
    es: {
      prompt: "¿Cuál es la capital de Chile?",
      options: ["Santiago", "Valparaíso", "Concepción", "Lima"],
    },
  },
  {
    id: "easy-capital-ecuador",
    index: 67,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Ecuador?",
      options: ["Quito", "Guayaquil", "Cuenca", "Bogota"],
    },
    es: {
      prompt: "¿Cuál es la capital de Ecuador?",
      options: ["Quito", "Guayaquil", "Cuenca", "Bogotá"],
    },
  },
  {
    id: "easy-capital-uruguay",
    index: 68,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Uruguay?",
      options: ["Montevideo", "Punta del Este", "Salto", "Asuncion"],
    },
    es: {
      prompt: "¿Cuál es la capital de Uruguay?",
      options: ["Montevideo", "Punta del Este", "Salto", "Asunción"],
    },
  },
  {
    id: "easy-capital-germany",
    index: 69,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Germany?",
      options: ["Berlin", "Munich", "Hamburg", "Vienna"],
    },
    es: {
      prompt: "¿Cuál es la capital de Alemania?",
      options: ["Berlín", "Múnich", "Hamburgo", "Viena"],
    },
  },
  {
    id: "easy-capital-spain",
    index: 70,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Spain?",
      options: ["Madrid", "Barcelona", "Seville", "Lisbon"],
    },
    es: {
      prompt: "¿Cuál es la capital de España?",
      options: ["Madrid", "Barcelona", "Sevilla", "Lisboa"],
    },
  },
  {
    id: "easy-capital-greece",
    index: 71,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Greece?",
      options: ["Athens", "Sparta", "Thessaloniki", "Rome"],
    },
    es: {
      prompt: "¿Cuál es la capital de Grecia?",
      options: ["Atenas", "Esparta", "Tesalónica", "Roma"],
    },
  },
  {
    id: "easy-capital-egypt",
    index: 72,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the capital of Egypt?",
      options: ["Cairo", "Alexandria", "Luxor", "Khartoum"],
    },
    es: {
      prompt: "¿Cuál es la capital de Egipto?",
      options: ["El Cairo", "Alejandría", "Luxor", "Jartum"],
    },
  },
  {
    id: "easy-largest-continent",
    index: 73,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which is the largest continent?",
      options: ["Asia", "Europe", "Africa", "Oceania"],
    },
    es: {
      prompt: "¿Cuál es el continente más grande?",
      options: ["Asia", "Europa", "África", "Oceanía"],
    },
  },
  {
    id: "easy-country-boot-shape",
    index: 74,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which country is famous for its boot shape on the map?",
      options: ["Italy", "Greece", "Portugal", "Croatia"],
    },
    es: {
      prompt: "¿Qué país es famoso por su forma de bota en el mapa?",
      options: ["Italia", "Grecia", "Portugal", "Croacia"],
    },
  },
  {
    id: "easy-animal-trunk",
    index: 75,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which animal has a long trunk?",
      options: ["Elephant", "Rhino", "Horse", "Bear"],
    },
    es: {
      prompt: "¿Qué animal tiene una trompa larga?",
      options: ["Elefante", "Rinoceronte", "Caballo", "Oso"],
    },
  },
  {
    id: "easy-animal-stripes",
    index: 76,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which animal is famous for its black and white stripes?",
      options: ["Zebra", "Tiger", "Panda", "Skunk"],
    },
    es: {
      prompt: "¿Qué animal es famoso por sus rayas blancas y negras?",
      options: ["Cebra", "Tigre", "Panda", "Zorrillo"],
    },
  },
  {
    id: "easy-baby-frog",
    index: 77,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is a baby frog called?",
      options: ["Tadpole", "Cub", "Pup", "Foal"],
    },
    es: {
      prompt: "¿Cómo se llama una cría de rana?",
      options: ["Renacuajo", "Cachorro", "Cría", "Potro"],
    },
  },
  {
    id: "easy-honey-insect",
    index: 78,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which insect makes honey?",
      options: ["Bee", "Ant", "Butterfly", "Beetle"],
    },
    es: {
      prompt: "¿Qué insecto produce miel?",
      options: ["Abeja", "Hormiga", "Mariposa", "Escarabajo"],
    },
  },
  {
    id: "easy-center-solar-star",
    index: 79,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the star at the center of the solar system?",
      options: ["Sun", "Polaris", "Sirius", "Venus"],
    },
    es: {
      prompt: "¿Cuál es la estrella del centro del sistema solar?",
      options: ["Sol", "Polaris", "Sirio", "Venus"],
    },
  },
  {
    id: "easy-see-stars-tool",
    index: 80,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which tool is used to observe distant stars?",
      options: ["Telescope", "Microscope", "Compass", "Thermometer"],
    },
    es: {
      prompt: "¿Qué herramienta se usa para observar estrellas lejanas?",
      options: ["Telescopio", "Microscopio", "Brújula", "Termómetro"],
    },
  },
  {
    id: "easy-breathe-gas",
    index: 81,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which gas do humans breathe to stay alive?",
      options: ["Oxygen", "Helium", "Carbon monoxide", "Hydrogen"],
    },
    es: {
      prompt: "¿Qué gas respiran los humanos para mantenerse con vida?",
      options: ["Oxígeno", "Helio", "Monóxido de carbono", "Hidrógeno"],
    },
  },
  {
    id: "easy-freezing-water",
    index: 82,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "At what temperature does water freeze in Celsius?",
      options: ["0 degrees", "10 degrees", "32 degrees", "100 degrees"],
    },
    es: {
      prompt: "¿A qué temperatura se congela el agua en grados Celsius?",
      options: ["0 grados", "10 grados", "32 grados", "100 grados"],
    },
  },
  {
    id: "easy-hours-day",
    index: 83,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "How many hours are in one day?",
      options: ["24", "12", "36", "48"],
    },
    es: {
      prompt: "¿Cuántas horas tiene un día?",
      options: ["24", "12", "36", "48"],
    },
  },
  {
    id: "easy-minutes-hour",
    index: 84,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "How many minutes are in one hour?",
      options: ["60", "30", "90", "120"],
    },
    es: {
      prompt: "¿Cuántos minutos hay en una hora?",
      options: ["60", "30", "90", "120"],
    },
  },
  {
    id: "easy-days-week",
    index: 85,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "How many days are in a week?",
      options: ["7", "5", "8", "10"],
    },
    es: {
      prompt: "¿Cuántos días tiene una semana?",
      options: ["7", "5", "8", "10"],
    },
  },
  {
    id: "easy-months-year",
    index: 86,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "How many months are in one year?",
      options: ["12", "10", "11", "13"],
    },
    es: {
      prompt: "¿Cuántos meses tiene un año?",
      options: ["12", "10", "11", "13"],
    },
  },
  {
    id: "easy-shape-equal-sides",
    index: 87,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What do you call a shape with four equal sides?",
      options: ["Square", "Triangle", "Circle", "Oval"],
    },
    es: {
      prompt: "¿Cómo se llama una figura con cuatro lados iguales?",
      options: ["Cuadrado", "Triángulo", "Círculo", "Óvalo"],
    },
  },
  {
    id: "easy-sport-shuttlecock",
    index: 88,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which sport uses a racket and a shuttlecock?",
      options: ["Badminton", "Baseball", "Rugby", "Boxing"],
    },
    es: {
      prompt: "¿Qué deporte usa una raqueta y un volante?",
      options: ["Bádminton", "Béisbol", "Rugby", "Boxeo"],
    },
  },
  {
    id: "easy-instrument-six-strings",
    index: 89,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which instrument usually has six strings?",
      options: ["Guitar", "Flute", "Trumpet", "Drum"],
    },
    es: {
      prompt: "¿Qué instrumento suele tener seis cuerdas?",
      options: ["Guitarra", "Flauta", "Trompeta", "Tambor"],
    },
  },
  {
    id: "easy-guacamole-fruit",
    index: 90,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which fruit is used to make guacamole?",
      options: ["Avocado", "Apple", "Pear", "Peach"],
    },
    es: {
      prompt: "¿Qué fruta se usa para hacer guacamole?",
      options: ["Aguacate", "Manzana", "Pera", "Durazno"],
    },
  },
  {
    id: "easy-banana-color",
    index: 91,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What color is a ripe banana?",
      options: ["Yellow", "Blue", "Purple", "Black"],
    },
    es: {
      prompt: "¿De qué color es un plátano maduro?",
      options: ["Amarillo", "Azul", "Morado", "Negro"],
    },
  },
  {
    id: "easy-brazil-continent",
    index: 92,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "On which continent is Brazil located?",
      options: ["South America", "Europe", "Africa", "Asia"],
    },
    es: {
      prompt: "¿En qué continente está Brasil?",
      options: ["América del Sur", "Europa", "África", "Asia"],
    },
  },
  {
    id: "easy-planet-earth",
    index: 93,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the name of the planet we live on?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
    },
    es: {
      prompt: "¿Cómo se llama el planeta en el que vivimos?",
      options: ["Tierra", "Marte", "Júpiter", "Saturno"],
    },
  },
  {
    id: "easy-magnetic-metal",
    index: 94,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which metal is strongly attracted by a magnet?",
      options: ["Iron", "Gold", "Silver", "Copper"],
    },
    es: {
      prompt: "¿Qué metal es atraído con fuerza por un imán?",
      options: ["Hierro", "Oro", "Plata", "Cobre"],
    },
  },
  {
    id: "easy-ears-sense",
    index: 95,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which sense uses the ears?",
      options: ["Hearing", "Sight", "Taste", "Smell"],
    },
    es: {
      prompt: "¿Qué sentido usa los oídos?",
      options: ["La audición", "La vista", "El gusto", "El olfato"],
    },
  },
  {
    id: "easy-animal-hump",
    index: 96,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which animal is known for having a hump?",
      options: ["Camel", "Wolf", "Rabbit", "Otter"],
    },
    es: {
      prompt: "¿Qué animal es conocido por tener joroba?",
      options: ["Camello", "Lobo", "Conejo", "Nutria"],
    },
  },
  {
    id: "easy-largest-organ",
    index: 97,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "What is the largest organ in the human body?",
      options: ["Skin", "Liver", "Brain", "Heart"],
    },
    es: {
      prompt: "¿Cuál es el órgano más grande del cuerpo humano?",
      options: ["La piel", "El hígado", "El cerebro", "El corazón"],
    },
  },
  {
    id: "easy-antarctica-bird",
    index: 98,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which bird is famous for living in Antarctica and not flying?",
      options: ["Penguin", "Eagle", "Owl", "Parrot"],
    },
    es: {
      prompt: "¿Qué ave es famosa por vivir en la Antártida y no volar?",
      options: ["Pingüino", "Águila", "Búho", "Loro"],
    },
  },
  {
    id: "easy-atlantic-ocean",
    index: 99,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "Which ocean lies between the Americas and Europe?",
      options: ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Arctic Ocean"],
    },
    es: {
      prompt: "¿Qué océano está entre América y Europa?",
      options: ["Océano Atlántico", "Océano Pacífico", "Océano Índico", "Océano Ártico"],
    },
  },
  {
    id: "easy-rainbow-colors",
    index: 100,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "How many colors are in a rainbow?",
      options: ["7", "5", "6", "8"],
    },
    es: {
      prompt: "¿Cuántos colores tiene el arcoíris?",
      options: ["7", "5", "6", "8"],
    },
  },
  {
    id: "easy-water-boiling",
    index: 101,
    category: 0,
    difficulty: 0,
    correctOption: 0,
    en: {
      prompt: "At what temperature does water boil at sea level in Celsius?",
      options: ["100 degrees", "50 degrees", "75 degrees", "120 degrees"],
    },
    es: {
      prompt: "¿A qué temperatura hierve el agua al nivel del mar en grados Celsius?",
      options: ["100 grados", "50 grados", "75 grados", "120 grados"],
    },
  },
  {
    id: "medium-longest-river",
    index: 102,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which river is traditionally considered the longest in the world?",
      options: ["Nile", "Amazon", "Yangtze", "Danube"],
    },
    es: {
      prompt: "¿Qué río se considera tradicionalmente el más largo del mundo?",
      options: ["Nilo", "Amazonas", "Yangtsé", "Danubio"],
    },
  },
  {
    id: "medium-japan-currency",
    index: 103,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the currency of Japan?",
      options: ["Yen", "Won", "Peso", "Dollar"],
    },
    es: {
      prompt: "¿Cuál es la moneda de Japón?",
      options: ["Yen", "Won", "Peso", "Dólar"],
    },
  },
  {
    id: "medium-brazil-language",
    index: 104,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What language is primarily spoken in Brazil?",
      options: ["Portuguese", "Spanish", "French", "English"],
    },
    es: {
      prompt: "¿Qué idioma se habla principalmente en Brasil?",
      options: ["Portugués", "Español", "Francés", "Inglés"],
    },
  },
  {
    id: "medium-first-us-president",
    index: 105,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who was the first president of the United States?",
      options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"],
    },
    es: {
      prompt: "¿Quién fue el primer presidente de Estados Unidos?",
      options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"],
    },
  },
  {
    id: "medium-relativity-scientist",
    index: 106,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which scientist is most closely associated with the theory of relativity?",
      options: ["Albert Einstein", "Isaac Newton", "Nikola Tesla", "Charles Darwin"],
    },
    es: {
      prompt: "¿Qué científico se asocia más con la teoría de la relatividad?",
      options: ["Albert Einstein", "Isaac Newton", "Nikola Tesla", "Charles Darwin"],
    },
  },
  {
    id: "medium-little-prince-author",
    index: 107,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who wrote The Little Prince?",
      options: ["Antoine de Saint-Exupery", "Victor Hugo", "Jules Verne", "Albert Camus"],
    },
    es: {
      prompt: "¿Quién escribió El principito?",
      options: ["Antoine de Saint-Exupéry", "Victor Hugo", "Jules Verne", "Albert Camus"],
    },
  },
  {
    id: "medium-four-seasons-composer",
    index: 108,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who composed The Four Seasons?",
      options: ["Antonio Vivaldi", "Mozart", "Chopin", "Bach"],
    },
    es: {
      prompt: "¿Quién compuso Las cuatro estaciones?",
      options: ["Antonio Vivaldi", "Mozart", "Chopin", "Bach"],
    },
  },
  {
    id: "medium-dali-painting",
    index: 109,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who painted The Persistence of Memory?",
      options: ["Salvador Dali", "Pablo Picasso", "Edvard Munch", "Henri Matisse"],
    },
    es: {
      prompt: "¿Quién pintó La persistencia de la memoria?",
      options: ["Salvador Dalí", "Pablo Picasso", "Edvard Munch", "Henri Matisse"],
    },
  },
  {
    id: "medium-big-apple",
    index: 110,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which city is known as the Big Apple?",
      options: ["New York City", "Los Angeles", "Chicago", "Boston"],
    },
    es: {
      prompt: "¿Qué ciudad es conocida como la Gran Manzana?",
      options: ["Nueva York", "Los Ángeles", "Chicago", "Boston"],
    },
  },
  {
    id: "medium-prime-meridian",
    index: 111,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which imaginary line divides the Earth into eastern and western hemispheres?",
      options: ["Prime Meridian", "Equator", "Tropic of Capricorn", "International Date Line"],
    },
    es: {
      prompt: "¿Qué línea imaginaria divide la Tierra en hemisferios oriental y occidental?",
      options: ["Meridiano de Greenwich", "Ecuador", "Trópico de Capricornio", "Línea internacional de cambio de fecha"],
    },
  },
  {
    id: "medium-indian-ocean",
    index: 112,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which ocean lies between Africa and Australia?",
      options: ["Indian Ocean", "Atlantic Ocean", "Pacific Ocean", "Arctic Ocean"],
    },
    es: {
      prompt: "¿Qué océano está entre África y Australia?",
      options: ["Océano Índico", "Océano Atlántico", "Océano Pacífico", "Océano Ártico"],
    },
  },
  {
    id: "medium-kangaroo-country",
    index: 113,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which country is famous for kangaroos?",
      options: ["Australia", "South Africa", "Argentina", "India"],
    },
    es: {
      prompt: "¿Qué país es famoso por los canguros?",
      options: ["Australia", "Sudáfrica", "Argentina", "India"],
    },
  },
  {
    id: "medium-bell-invention",
    index: 114,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which invention is associated with Alexander Graham Bell?",
      options: ["Telephone", "Television", "Radio", "Light bulb"],
    },
    es: {
      prompt: "¿Con qué invento se asocia a Alexander Graham Bell?",
      options: ["Teléfono", "Televisión", "Radio", "Bombilla"],
    },
  },
  {
    id: "medium-penicillin",
    index: 115,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which scientist is credited with discovering penicillin?",
      options: ["Alexander Fleming", "Louis Pasteur", "Gregor Mendel", "Niels Bohr"],
    },
    es: {
      prompt: "¿A qué científico se le atribuye el descubrimiento de la penicilina?",
      options: ["Alexander Fleming", "Louis Pasteur", "Gregor Mendel", "Niels Bohr"],
    },
  },
  {
    id: "medium-liquid-metal",
    index: 116,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which metal is liquid at room temperature?",
      options: ["Mercury", "Iron", "Aluminum", "Nickel"],
    },
    es: {
      prompt: "¿Qué metal es líquido a temperatura ambiente?",
      options: ["Mercurio", "Hierro", "Aluminio", "Níquel"],
    },
  },
  {
    id: "medium-earthquake-instrument",
    index: 117,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which instrument records earthquakes?",
      options: ["Seismograph", "Barometer", "Altimeter", "Chronometer"],
    },
    es: {
      prompt: "¿Qué instrumento registra los terremotos?",
      options: ["Sismógrafo", "Barómetro", "Altímetro", "Cronómetro"],
    },
  },
  {
    id: "medium-kidney-function",
    index: 118,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which organ helps filter blood to produce urine?",
      options: ["Kidney", "Spleen", "Stomach", "Lung"],
    },
    es: {
      prompt: "¿Qué órgano ayuda a filtrar la sangre para producir orina?",
      options: ["Riñón", "Bazo", "Estómago", "Pulmón"],
    },
  },
  {
    id: "medium-weather-study",
    index: 119,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the scientific study of weather called?",
      options: ["Meteorology", "Geology", "Ecology", "Astronomy"],
    },
    es: {
      prompt: "¿Cómo se llama el estudio científico del clima y del tiempo?",
      options: ["Meteorología", "Geología", "Ecología", "Astronomía"],
    },
  },
  {
    id: "medium-human-bones",
    index: 120,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "How many bones does an adult human usually have?",
      options: ["206", "186", "226", "246"],
    },
    es: {
      prompt: "¿Cuántos huesos tiene normalmente un ser humano adulto?",
      options: ["206", "186", "226", "246"],
    },
  },
  {
    id: "medium-largest-island",
    index: 121,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which is the largest island in the world?",
      options: ["Greenland", "Madagascar", "Borneo", "Iceland"],
    },
    es: {
      prompt: "¿Cuál es la isla más grande del mundo?",
      options: ["Groenlandia", "Madagascar", "Borneo", "Islandia"],
    },
  },
  {
    id: "medium-machu-picchu",
    index: 122,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which famous Inca site is in Peru?",
      options: ["Machu Picchu", "Petra", "Pompeii", "Angkor Wat"],
    },
    es: {
      prompt: "¿Qué famoso sitio inca está en Perú?",
      options: ["Machu Picchu", "Petra", "Pompeya", "Angkor Wat"],
    },
  },
  {
    id: "medium-ww2-end",
    index: 123,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "In what year did World War II end?",
      options: ["1945", "1939", "1941", "1950"],
    },
    es: {
      prompt: "¿En qué año terminó la Segunda Guerra Mundial?",
      options: ["1945", "1939", "1941", "1950"],
    },
  },
  {
    id: "medium-gold-symbol",
    index: 124,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the chemical symbol for gold?",
      options: ["Au", "Ag", "Gd", "Go"],
    },
    es: {
      prompt: "¿Cuál es el símbolo químico del oro?",
      options: ["Au", "Ag", "Gd", "Go"],
    },
  },
  {
    id: "medium-hobbit-author",
    index: 125,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who wrote The Hobbit?",
      options: ["J. R. R. Tolkien", "C. S. Lewis", "George Orwell", "H. G. Wells"],
    },
    es: {
      prompt: "¿Quién escribió El hobbit?",
      options: ["J. R. R. Tolkien", "C. S. Lewis", "George Orwell", "H. G. Wells"],
    },
  },
  {
    id: "medium-david-sculptor",
    index: 126,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Who sculpted David?",
      options: ["Michelangelo", "Donatello", "Bernini", "Rodin"],
    },
    es: {
      prompt: "¿Quién esculpió David?",
      options: ["Miguel Ángel", "Donatello", "Bernini", "Rodin"],
    },
  },
  {
    id: "medium-violin-family",
    index: 127,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "The violin belongs to which family of instruments?",
      options: ["String family", "Brass family", "Percussion family", "Woodwind family"],
    },
    es: {
      prompt: "¿A qué familia de instrumentos pertenece el violín?",
      options: ["Familia de cuerda", "Familia de metal", "Familia de percusión", "Familia de viento madera"],
    },
  },
  {
    id: "medium-mammal-lays-eggs",
    index: 128,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which mammal lays eggs?",
      options: ["Platypus", "Seal", "Dolphin", "Bat"],
    },
    es: {
      prompt: "¿Qué mamífero pone huevos?",
      options: ["Ornitorrinco", "Foca", "Delfín", "Murciélago"],
    },
  },
  {
    id: "medium-maple-flag",
    index: 129,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which country has a maple leaf on its flag?",
      options: ["Canada", "Austria", "Switzerland", "Norway"],
    },
    es: {
      prompt: "¿Qué país tiene una hoja de arce en su bandera?",
      options: ["Canadá", "Austria", "Suiza", "Noruega"],
    },
  },
  {
    id: "medium-paris-river",
    index: 130,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which river runs through Paris?",
      options: ["Seine", "Thames", "Rhine", "Po"],
    },
    es: {
      prompt: "¿Qué río pasa por París?",
      options: ["Sena", "Támesis", "Rin", "Po"],
    },
  },
  {
    id: "medium-atmosphere-gas",
    index: 131,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which gas is most abundant in Earth's atmosphere?",
      options: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"],
    },
    es: {
      prompt: "¿Qué gas es el más abundante en la atmósfera terrestre?",
      options: ["Nitrógeno", "Oxígeno", "Dióxido de carbono", "Argón"],
    },
  },
  {
    id: "medium-transpiration",
    index: 132,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the process called when plants lose water through their leaves?",
      options: ["Transpiration", "Fermentation", "Pollination", "Condensation"],
    },
    es: {
      prompt: "¿Cómo se llama el proceso por el que las plantas pierden agua por las hojas?",
      options: ["Transpiración", "Fermentación", "Polinización", "Condensación"],
    },
  },
  {
    id: "medium-right-triangle",
    index: 133,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What do you call a triangle with one 90-degree angle?",
      options: ["Right triangle", "Isosceles triangle", "Equilateral triangle", "Scalene triangle"],
    },
    es: {
      prompt: "¿Cómo se llama un triángulo con un ángulo de 90 grados?",
      options: ["Triángulo rectángulo", "Triángulo isósceles", "Triángulo equilátero", "Triángulo escaleno"],
    },
  },
  {
    id: "medium-century-length",
    index: 134,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "How many years are in a century?",
      options: ["100", "50", "75", "120"],
    },
    es: {
      prompt: "¿Cuántos años hay en un siglo?",
      options: ["100", "50", "75", "120"],
    },
  },
  {
    id: "medium-pompeii-volcano",
    index: 135,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which volcano buried Pompeii?",
      options: ["Vesuvius", "Etna", "Krakatoa", "Fuji"],
    },
    es: {
      prompt: "¿Qué volcán sepultó Pompeya?",
      options: ["Vesubio", "Etna", "Krakatoa", "Fuji"],
    },
  },
  {
    id: "medium-newton-laws",
    index: 136,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which scientist formulated the laws of motion?",
      options: ["Isaac Newton", "Galileo Galilei", "Blaise Pascal", "Carl Linnaeus"],
    },
    es: {
      prompt: "¿Qué científico formuló las leyes del movimiento?",
      options: ["Isaac Newton", "Galileo Galilei", "Blaise Pascal", "Carl Linneo"],
    },
  },
  {
    id: "medium-louvre-monalisa",
    index: 137,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "In which museum is the Mona Lisa displayed?",
      options: ["Louvre Museum", "Prado Museum", "British Museum", "Uffizi Gallery"],
    },
    es: {
      prompt: "¿En qué museo se exhibe la Mona Lisa?",
      options: ["Museo del Louvre", "Museo del Prado", "Museo Británico", "Galería Uffizi"],
    },
  },
  {
    id: "medium-el-nino",
    index: 138,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What climate phenomenon periodically warms the Pacific Ocean near South America?",
      options: ["El Nino", "Monsoon", "La Nina", "Jet stream"],
    },
    es: {
      prompt: "¿Qué fenómeno climático calienta periódicamente el Pacífico cerca de Sudamérica?",
      options: ["El Niño", "Monzón", "La Niña", "Corriente en chorro"],
    },
  },
  {
    id: "medium-mitosis",
    index: 139,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "What is the cell division process for growth and repair called?",
      options: ["Mitosis", "Meiosis", "Fusion", "Diffusion"],
    },
    es: {
      prompt: "¿Cómo se llama el proceso de división celular para crecer y reparar tejidos?",
      options: ["Mitosis", "Meiosis", "Fusión", "Difusión"],
    },
  },
  {
    id: "medium-most-countries",
    index: 140,
    category: 0,
    difficulty: 1,
    correctOption: 0,
    en: {
      prompt: "Which continent has the most countries?",
      options: ["Africa", "Europe", "Asia", "South America"],
    },
    es: {
      prompt: "¿Qué continente tiene más países?",
      options: ["África", "Europa", "Asia", "América del Sur"],
    },
  },
  {
    id: "hard-potassium-symbol",
    index: 141,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What is the chemical symbol for potassium?",
      options: ["K", "P", "Pt", "Po"],
    },
    es: {
      prompt: "¿Cuál es el símbolo químico del potasio?",
      options: ["K", "P", "Pt", "Po"],
    },
  },
  {
    id: "hard-ohm-unit",
    index: 142,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which unit measures electrical resistance?",
      options: ["Ohm", "Watt", "Volt", "Ampere"],
    },
    es: {
      prompt: "¿Qué unidad mide la resistencia eléctrica?",
      options: ["Ohmio", "Vatio", "Voltio", "Amperio"],
    },
  },
  {
    id: "hard-dna-shape",
    index: 143,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What is the shape of the DNA molecule?",
      options: ["Double helix", "Perfect sphere", "Single ring", "Flat spiral"],
    },
    es: {
      prompt: "¿Cuál es la forma de la molécula de ADN?",
      options: ["Doble hélice", "Esfera perfecta", "Anillo simple", "Espiral plana"],
    },
  },
  {
    id: "hard-heliocentric-model",
    index: 144,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who is strongly associated with the heliocentric model of the solar system?",
      options: ["Nicolaus Copernicus", "Ptolemy", "Tycho Brahe", "Johannes Kepler"],
    },
    es: {
      prompt: "¿Quién se asocia con el modelo heliocéntrico del sistema solar?",
      options: ["Nicolás Copérnico", "Ptolomeo", "Tycho Brahe", "Johannes Kepler"],
    },
  },
  {
    id: "hard-moonlight-sonata",
    index: 145,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who composed the Moonlight Sonata?",
      options: ["Ludwig van Beethoven", "Franz Schubert", "Johann Strauss", "Claude Debussy"],
    },
    es: {
      prompt: "¿Quién compuso la Sonata Claro de Luna?",
      options: ["Ludwig van Beethoven", "Franz Schubert", "Johann Strauss", "Claude Debussy"],
    },
  },
  {
    id: "hard-probability-branch",
    index: 146,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which branch of mathematics studies chance and uncertainty?",
      options: ["Probability", "Topology", "Geometry", "Calculus"],
    },
    es: {
      prompt: "¿Qué rama de las matemáticas estudia el azar y la incertidumbre?",
      options: ["Probabilidad", "Topología", "Geometría", "Cálculo"],
    },
  },
  {
    id: "hard-republic-author",
    index: 147,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who wrote The Republic?",
      options: ["Plato", "Herodotus", "Virgil", "Seneca"],
    },
    es: {
      prompt: "¿Quién escribió La República?",
      options: ["Platón", "Heródoto", "Virgilio", "Séneca"],
    },
  },
  {
    id: "hard-first-element",
    index: 148,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What is the first element in the periodic table?",
      options: ["Hydrogen", "Helium", "Lithium", "Oxygen"],
    },
    es: {
      prompt: "¿Cuál es el primer elemento de la tabla periódica?",
      options: ["Hidrógeno", "Helio", "Litio", "Oxígeno"],
    },
  },
  {
    id: "hard-cellular-respiration",
    index: 149,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What process converts glucose into usable energy inside cells?",
      options: ["Cellular respiration", "Evaporation", "Photosynthesis", "Sedimentation"],
    },
    es: {
      prompt: "¿Qué proceso convierte la glucosa en energía utilizable dentro de las células?",
      options: ["Respiración celular", "Evaporación", "Fotosíntesis", "Sedimentación"],
    },
  },
  {
    id: "hard-binary-base",
    index: 150,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "The binary number system is based on which number?",
      options: ["2", "8", "10", "16"],
    },
    es: {
      prompt: "¿En qué número se basa el sistema binario?",
      options: ["2", "8", "10", "16"],
    },
  },
  {
    id: "hard-cpu-meaning",
    index: 151,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What does CPU stand for?",
      options: ["Central Processing Unit", "Central Program Utility", "Computer Primary Unit", "Core Power Usage"],
    },
    es: {
      prompt: "¿Qué significa CPU?",
      options: ["Unidad central de procesamiento", "Utilidad central de programas", "Unidad primaria de computadora", "Uso de potencia del núcleo"],
    },
  },
  {
    id: "hard-https-meaning",
    index: 152,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which protocol is identified by HTTPS?",
      options: ["Hypertext Transfer Protocol Secure", "High Transfer Text Process Standard", "Hyper Terminal Transport Program Service", "Host Transmission Type Protection System"],
    },
    es: {
      prompt: "¿Qué protocolo identifica la sigla HTTPS?",
      options: ["Hypertext Transfer Protocol Secure", "High Transfer Text Process Standard", "Hyper Terminal Transport Program Service", "Host Transmission Type Protection System"],
    },
  },
  {
    id: "hard-vitamin-c",
    index: 153,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which disease is caused by a severe lack of vitamin C?",
      options: ["Scurvy", "Rickets", "Malaria", "Rabies"],
    },
    es: {
      prompt: "¿Qué enfermedad causa una falta grave de vitamina C?",
      options: ["Escorbuto", "Raquitismo", "Malaria", "Rabia"],
    },
  },
  {
    id: "hard-monet-movement",
    index: 154,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Claude Monet is associated with which art movement?",
      options: ["Impressionism", "Cubism", "Baroque", "Surrealism"],
    },
    es: {
      prompt: "¿Con qué movimiento artístico se asocia a Claude Monet?",
      options: ["Impresionismo", "Cubismo", "Barroco", "Surrealismo"],
    },
  },
  {
    id: "hard-versailles-treaty",
    index: 155,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which treaty formally ended World War I?",
      options: ["Treaty of Versailles", "Treaty of Utrecht", "Treaty of Paris", "Treaty of Tordesillas"],
    },
    es: {
      prompt: "¿Qué tratado puso fin formalmente a la Primera Guerra Mundial?",
      options: ["Tratado de Versalles", "Tratado de Utrecht", "Tratado de París", "Tratado de Tordesillas"],
    },
  },
  {
    id: "hard-kepler-laws",
    index: 156,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who formulated the laws of planetary motion?",
      options: ["Johannes Kepler", "Galileo Galilei", "Edmond Halley", "Carl Gauss"],
    },
    es: {
      prompt: "¿Quién formuló las leyes del movimiento planetario?",
      options: ["Johannes Kepler", "Galileo Galilei", "Edmond Halley", "Carl Gauss"],
    },
  },
  {
    id: "hard-insulin-organ",
    index: 157,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which organ produces insulin?",
      options: ["Pancreas", "Lung", "Kidney", "Gallbladder"],
    },
    es: {
      prompt: "¿Qué órgano produce insulina?",
      options: ["Páncreas", "Pulmón", "Riñón", "Vesícula biliar"],
    },
  },
  {
    id: "hard-pencil-carbon",
    index: 158,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What form of carbon is commonly found in pencil cores?",
      options: ["Graphite", "Diamond", "Coal", "Quartz"],
    },
    es: {
      prompt: "¿Qué forma de carbono se encuentra normalmente en el interior de los lápices?",
      options: ["Grafito", "Diamante", "Carbón", "Cuarzo"],
    },
  },
  {
    id: "hard-ozone-layer",
    index: 159,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "In which layer of the atmosphere is most ozone found?",
      options: ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"],
    },
    es: {
      prompt: "¿En qué capa de la atmósfera se encuentra la mayor parte del ozono?",
      options: ["Estratosfera", "Troposfera", "Mesosfera", "Termosfera"],
    },
  },
  {
    id: "hard-universal-donor",
    index: 160,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which blood type is known as the universal donor?",
      options: ["O negative", "AB positive", "A positive", "B negative"],
    },
    es: {
      prompt: "¿Qué grupo sanguíneo se conoce como donante universal?",
      options: ["O negativo", "AB positivo", "A positivo", "B negativo"],
    },
  },
  {
    id: "hard-human-chromosomes",
    index: 161,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "How many chromosomes are in a typical human somatic cell?",
      options: ["46", "23", "44", "48"],
    },
    es: {
      prompt: "¿Cuántos cromosomas hay en una célula somática humana típica?",
      options: ["46", "23", "44", "48"],
    },
  },
  {
    id: "hard-taxonomy",
    index: 162,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What system classifies living beings using genus and species?",
      options: ["Taxonomy", "Chronology", "Cartography", "Etymology"],
    },
    es: {
      prompt: "¿Qué sistema clasifica a los seres vivos usando género y especie?",
      options: ["Taxonomía", "Cronología", "Cartografía", "Etimología"],
    },
  },
  {
    id: "hard-descartes-quote",
    index: 163,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who said “I think, therefore I am”?",
      options: ["Rene Descartes", "Immanuel Kant", "John Locke", "David Hume"],
    },
    es: {
      prompt: "¿Quién dijo «Pienso, luego existo»?",
      options: ["René Descartes", "Immanuel Kant", "John Locke", "David Hume"],
    },
  },
  {
    id: "hard-reykjavik-country",
    index: 164,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Reykjavik is the capital of which country?",
      options: ["Iceland", "Finland", "Norway", "Estonia"],
    },
    es: {
      prompt: "¿Reikiavik es la capital de qué país?",
      options: ["Islandia", "Finlandia", "Noruega", "Estonia"],
    },
  },
  {
    id: "hard-frequency-unit",
    index: 165,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which unit is used to measure frequency?",
      options: ["Hertz", "Joule", "Newton", "Pascal"],
    },
    es: {
      prompt: "¿Qué unidad se usa para medir la frecuencia?",
      options: ["Hercio", "Julio", "Newton", "Pascal"],
    },
  },
  {
    id: "hard-day-longer-than-year",
    index: 166,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which planet has a day longer than its year?",
      options: ["Venus", "Mars", "Jupiter", "Mercury"],
    },
    es: {
      prompt: "¿Qué planeta tiene un día más largo que su año?",
      options: ["Venus", "Marte", "Júpiter", "Mercurio"],
    },
  },
  {
    id: "hard-mendel-genetics",
    index: 167,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who is known as the father of genetics?",
      options: ["Gregor Mendel", "Louis Pasteur", "Alexander Fleming", "Francis Crick"],
    },
    es: {
      prompt: "¿Quién es conocido como el padre de la genética?",
      options: ["Gregor Mendel", "Louis Pasteur", "Alexander Fleming", "Francis Crick"],
    },
  },
  {
    id: "hard-igneous-rock",
    index: 168,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What type of rock forms when magma cools?",
      options: ["Igneous rock", "Sedimentary rock", "Metamorphic rock", "Limestone"],
    },
    es: {
      prompt: "¿Qué tipo de roca se forma cuando el magma se enfría?",
      options: ["Roca ígnea", "Roca sedimentaria", "Roca metamórfica", "Caliza"],
    },
  },
  {
    id: "hard-eulers-number",
    index: 169,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "What mathematical constant is approximately equal to 2.71828?",
      options: ["Euler's number", "Pi", "Golden ratio", "Imaginary unit"],
    },
    es: {
      prompt: "¿Qué constante matemática es aproximadamente igual a 2.71828?",
      options: ["Número de Euler", "Pi", "Proporción áurea", "Unidad imaginaria"],
    },
  },
  {
    id: "hard-mycology",
    index: 170,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which branch of biology studies fungi?",
      options: ["Mycology", "Botany", "Zoology", "Genetics"],
    },
    es: {
      prompt: "¿Qué rama de la biología estudia los hongos?",
      options: ["Micología", "Botánica", "Zoología", "Genética"],
    },
  },
  {
    id: "hard-neon-gas",
    index: 171,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which noble gas is commonly used in bright advertising signs?",
      options: ["Neon", "Argon", "Xenon", "Krypton"],
    },
    es: {
      prompt: "¿Qué gas noble se usa con frecuencia en letreros luminosos?",
      options: ["Neón", "Argón", "Xenón", "Kriptón"],
    },
  },
  {
    id: "hard-greenland-ownership",
    index: 172,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which country is responsible for Greenland?",
      options: ["Denmark", "Canada", "Iceland", "Sweden"],
    },
    es: {
      prompt: "¿Qué país es responsable de Groenlandia?",
      options: ["Dinamarca", "Canadá", "Islandia", "Suecia"],
    },
  },
  {
    id: "hard-alexandria-library",
    index: 173,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "The famous ancient library was located in which city?",
      options: ["Alexandria", "Athens", "Rome", "Carthage"],
    },
    es: {
      prompt: "¿En qué ciudad estaba la famosa biblioteca antigua?",
      options: ["Alejandría", "Atenas", "Roma", "Cartago"],
    },
  },
  {
    id: "hard-pearl-harbor",
    index: 174,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which country attacked Pearl Harbor in 1941?",
      options: ["Japan", "Germany", "Italy", "Soviet Union"],
    },
    es: {
      prompt: "¿Qué país atacó Pearl Harbor en 1941?",
      options: ["Japón", "Alemania", "Italia", "Unión Soviética"],
    },
  },
  {
    id: "hard-lifo-structure",
    index: 175,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which data structure follows the LIFO rule?",
      options: ["Stack", "Queue", "Tree", "Graph"],
    },
    es: {
      prompt: "¿Qué estructura de datos sigue la regla LIFO?",
      options: ["Pila", "Cola", "Árbol", "Grafo"],
    },
  },
  {
    id: "hard-aristotle-tutor",
    index: 176,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Who tutored Alexander the Great?",
      options: ["Aristotle", "Plato", "Socrates", "Pericles"],
    },
    es: {
      prompt: "¿Quién fue tutor de Alejandro Magno?",
      options: ["Aristóteles", "Platón", "Sócrates", "Pericles"],
    },
  },
  {
    id: "hard-radioactivity-curie",
    index: 177,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which scientist is famous for pioneering research on radioactivity?",
      options: ["Marie Curie", "Ada Lovelace", "Rosalind Franklin", "Jane Goodall"],
    },
    es: {
      prompt: "¿Qué científica es famosa por impulsar la investigación sobre la radiactividad?",
      options: ["Marie Curie", "Ada Lovelace", "Rosalind Franklin", "Jane Goodall"],
    },
  },
  {
    id: "hard-red-spot-planet",
    index: 178,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "The Great Red Spot is a storm on which planet?",
      options: ["Jupiter", "Saturn", "Mars", "Neptune"],
    },
    es: {
      prompt: "¿La Gran Mancha Roja es una tormenta de qué planeta?",
      options: ["Júpiter", "Saturno", "Marte", "Neptuno"],
    },
  },
  {
    id: "hard-pythagorean-theorem",
    index: 179,
    category: 0,
    difficulty: 2,
    correctOption: 0,
    en: {
      prompt: "Which theorem relates the sides of a right triangle?",
      options: ["Pythagorean theorem", "Binomial theorem", "Fundamental theorem of calculus", "Mean value theorem"],
    },
    es: {
      prompt: "¿Qué teorema relaciona los lados de un triángulo rectángulo?",
      options: ["Teorema de Pitágoras", "Teorema binomial", "Teorema fundamental del cálculo", "Teorema del valor medio"],
    },
  },

]

const QUESTION_SEEDS: LocalQuestionSeed[] = CANONICAL_QUESTIONS.map((record) => ({
  category: record.category,
  correctOption: record.correctOption,
  difficulty: record.difficulty,
  id: record.id,
  index: record.index,
}))

const QUESTION_RECORDS_BY_KEY = new Map(
  CANONICAL_QUESTIONS.map((record) => [`${record.index}:${record.category}`, record]),
)

const normalizeHex = (value: string) => `0x${BigInt(value).toString(16)}`

const hashPair = (left: string, right: string) =>
  normalizeHex(hash.computePoseidonHashOnElements([left, right]))

const buildQuestionLeafHash = (seed: LocalQuestionSeed) =>
  normalizeHex(
    hash.computePoseidonHashOnElements([
      seed.index.toString(),
      seed.category.toString(),
      seed.correctOption.toString(),
    ]),
  )

const buildMerkleArtifacts = (seeds: LocalQuestionSeed[]) => {
  const leaves = seeds.map((seed) => buildQuestionLeafHash(seed))
  const proofs = Array.from({ length: seeds.length }, () => ({
    merkleDirections: [] as Array<0 | 1>,
    merkleProof: [] as string[],
  }))

  let level = leaves.map((hashValue, index) => ({ hashValue, indexes: [index] }))

  while (level.length > 1) {
    const nextLevel: Array<{ hashValue: string; indexes: number[] }> = []

    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]
      const right = level[index + 1]

      if (!right) {
        nextLevel.push(left)
        continue
      }

      for (const leafIndex of left.indexes) {
        proofs[leafIndex].merkleProof.push(right.hashValue)
        proofs[leafIndex].merkleDirections.push(0)
      }

      for (const leafIndex of right.indexes) {
        proofs[leafIndex].merkleProof.push(left.hashValue)
        proofs[leafIndex].merkleDirections.push(1)
      }

      nextLevel.push({
        hashValue: hashPair(left.hashValue, right.hashValue),
        indexes: [...left.indexes, ...right.indexes],
      })
    }

    level = nextLevel
  }

  return {
    hydratedQuestions: seeds.map((seed, index) => ({
      ...seed,
      merkleDirections: proofs[index].merkleDirections,
      merkleProof: proofs[index].merkleProof,
    })),
    root: level[0]?.hashValue ?? '0x0',
  }
}

const artifacts = buildMerkleArtifacts(QUESTION_SEEDS)
const questionArtifactsByKey = new Map(
  artifacts.hydratedQuestions.map((question) => [`${question.index}:${question.category}`, question]),
)

const toOptionTuple = <T,>(values: T[]): [T, T, T, T] => {
  if (values.length !== 4) {
    throw new Error(`Expected 4 values, received ${values.length}`)
  }

  return values as [T, T, T, T]
}

const asBigInt = (value: bigint | number | string) => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number') {
    return BigInt(value)
  }

  const normalized = value.trim()
  if (normalized.length === 0) {
    return 0n
  }

  return normalized.startsWith('0x') || normalized.startsWith('0X') ? BigInt(normalized) : BigInt(normalized)
}

export const localDifficultyToTriviaDifficulty = (difficulty: DifficultyLevel): TriviaDifficulty => {
  if (difficulty === 1) {
    return 'medium'
  }

  if (difficulty === 2) {
    return 'hard'
  }

  return 'easy'
}

export const getDeterministicDisplayOrder = (params: {
  questionId: bigint | number | string
  questionIndex: number
  seedNonce: string
}): [OptionIndex, OptionIndex, OptionIndex, OptionIndex] => {
  const order: OptionIndex[] = [0, 1, 2, 3]
  const baseQuestionId = asBigInt(params.questionId)
  const seedNonce = asBigInt(params.seedNonce)

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapSeed = hash.computePoseidonHashOnElements([
      seedNonce.toString(),
      baseQuestionId.toString(),
      params.questionIndex.toString(),
      index.toString(),
    ])
    const swapIndex = Number(asBigInt(swapSeed) % BigInt(index + 1))
    const current = order[index]
    order[index] = order[swapIndex]
    order[swapIndex] = current
  }

  return toOptionTuple(order)
}

const buildDisplayMappings = (params: {
  correctOption: OptionIndex
  questionId: bigint | number | string
  questionIndex: number
  seedNonce: string
}) => {
  const displayToCanonical = getDeterministicDisplayOrder(params)
  const canonicalToDisplay = [0, 0, 0, 0] as OptionIndex[]

  displayToCanonical.forEach((canonicalIndex, displayIndex) => {
    canonicalToDisplay[canonicalIndex] = displayIndex as OptionIndex
  })

  return {
    canonicalToDisplay: toOptionTuple(canonicalToDisplay),
    displayCorrectOption: canonicalToDisplay[params.correctOption] as OptionIndex,
    displayToCanonical,
  }
}

export const mapDisplayOptionToCanonical = (question: HydratedQuestion, displayIndex: number) => {
  return question.displayToCanonical[displayIndex] ?? question.correctOption
}

export const mapCanonicalOptionToDisplay = (question: HydratedQuestion, canonicalIndex: number) => {
  return question.canonicalToDisplay[canonicalIndex] ?? question.displayCorrectOption
}

export const LOCAL_QUESTION_SET_ID = 1n
export const LOCAL_QUESTION_SET_COUNT = QUESTION_SEEDS.length
export const LOCAL_QUESTION_SET_ROOT = artifacts.root
export const LOCAL_QUESTION_SET_VERSION = 2

export const LOCAL_QUESTION_SET = artifacts.hydratedQuestions

export const getHydratedQuestion = (
  questionIndex: number,
  category: number,
  language: AppLanguage = 'en',
  shuffleSeed?: {
    questionId: bigint | number | string
    seedNonce: string
  },
): HydratedQuestion | null => {
  const key = `${questionIndex}:${category}`
  const baseQuestion = questionArtifactsByKey.get(key)
  const record = QUESTION_RECORDS_BY_KEY.get(key)

  if (!baseQuestion || !record) {
    return null
  }

  const localizedCopy = language === 'es' ? record.es : record.en
  const mappings = shuffleSeed
    ? buildDisplayMappings({
        correctOption: record.correctOption,
        questionId: shuffleSeed.questionId,
        questionIndex,
        seedNonce: shuffleSeed.seedNonce,
      })
    : {
        canonicalToDisplay: [0, 1, 2, 3] as [OptionIndex, OptionIndex, OptionIndex, OptionIndex],
        displayCorrectOption: record.correctOption,
        displayToCanonical: [0, 1, 2, 3] as [OptionIndex, OptionIndex, OptionIndex, OptionIndex],
      }

  return {
    ...baseQuestion,
    canonicalToDisplay: mappings.canonicalToDisplay,
    displayCorrectOption: mappings.displayCorrectOption,
    displayOptions: toOptionTuple(mappings.displayToCanonical.map((index) => localizedCopy.options[index])),
    displayPrompt: localizedCopy.prompt,
    displayToCanonical: mappings.displayToCanonical,
  }
}

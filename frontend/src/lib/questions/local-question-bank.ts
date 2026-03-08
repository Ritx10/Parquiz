import { hash } from 'starknet'
import type { AppLanguage } from '../../store/app-settings-store'

type QuestionCopy = {
  options: [string, string, string, string]
  prompt: string
}

type QuestionEntry = {
  correctOption: 0 | 1 | 2 | 3
  en: QuestionCopy
  es: QuestionCopy
}

type LocalQuestionSeed = {
  category: number
  correctOption: 0 | 1 | 2 | 3
  difficulty: 0
  options: [string, string, string, string]
  prompt: string
  questionIndex: number
}

export type HydratedQuestion = LocalQuestionSeed & {
  displayOptions: [string, string, string, string]
  displayPrompt: string
  merkleDirections: Array<0 | 1>
  merkleProof: string[]
}

const QUESTION_BANK: QuestionEntry[] = [
  {
    correctOption: 0,
    en: {
      prompt: 'What is the capital of Argentina?',
      options: ['Buenos Aires', 'Cordoba', 'Lima', 'Bogota'],
    },
    es: {
      prompt: 'Cual es la capital de Argentina?',
      options: ['Buenos Aires', 'Cordoba', 'Lima', 'Bogota'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the capital of France?',
      options: ['Paris', 'Rome', 'Lisbon', 'Berlin'],
    },
    es: {
      prompt: 'Cual es la capital de Francia?',
      options: ['Paris', 'Roma', 'Lisboa', 'Berlin'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the capital of Japan?',
      options: ['Tokyo', 'Seoul', 'Beijing', 'Bangkok'],
    },
    es: {
      prompt: 'Cual es la capital de Japon?',
      options: ['Tokio', 'Seul', 'Pekin', 'Bangkok'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the capital of Brazil?',
      options: ['Brasilia', 'Rio de Janeiro', 'Sao Paulo', 'Montevideo'],
    },
    es: {
      prompt: 'Cual es la capital de Brasil?',
      options: ['Brasilia', 'Rio de Janeiro', 'Sao Paulo', 'Montevideo'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the capital of Mexico?',
      options: ['Mexico City', 'Cancun', 'Guadalajara', 'Quito'],
    },
    es: {
      prompt: 'Cual es la capital de Mexico?',
      options: ['Ciudad de Mexico', 'Cancun', 'Guadalajara', 'Quito'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the capital of Colombia?',
      options: ['Bogota', 'Medellin', 'Quito', 'Caracas'],
    },
    es: {
      prompt: 'Cual es la capital de Colombia?',
      options: ['Bogota', 'Medellin', 'Quito', 'Caracas'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which planet is known as the Red Planet?',
      options: ['Mars', 'Venus', 'Neptune', 'Mercury'],
    },
    es: {
      prompt: 'Que planeta es conocido como el planeta rojo?',
      options: ['Marte', 'Venus', 'Neptuno', 'Mercurio'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which planet is famous for its rings?',
      options: ['Saturn', 'Jupiter', 'Mercury', 'Earth'],
    },
    es: {
      prompt: 'Que planeta es famoso por sus anillos?',
      options: ['Saturno', 'Jupiter', 'Mercurio', 'Tierra'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which planet is closest to the Sun?',
      options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
    },
    es: {
      prompt: 'Cual es el planeta mas cercano al Sol?',
      options: ['Mercurio', 'Venus', 'Marte', 'Jupiter'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which planet is the largest in the solar system?',
      options: ['Jupiter', 'Mars', 'Saturn', 'Uranus'],
    },
    es: {
      prompt: 'Cual es el planeta mas grande del sistema solar?',
      options: ['Jupiter', 'Marte', 'Saturno', 'Urano'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which ocean is the largest on Earth?',
      options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
    },
    es: {
      prompt: 'Cual es el oceano mas grande de la Tierra?',
      options: ['Oceano Pacifico', 'Oceano Atlantico', 'Oceano Indico', 'Oceano Artico'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In which continent is the Sahara Desert located?',
      options: ['Africa', 'Asia', 'Oceania', 'America'],
    },
    es: {
      prompt: 'En que continente esta el desierto del Sahara?',
      options: ['Africa', 'Asia', 'Oceania', 'America'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Mount Aconcagua belongs to which mountain range?',
      options: ['Andes', 'Alps', 'Himalayas', 'Rockies'],
    },
    es: {
      prompt: 'En que cordillera esta el Aconcagua?',
      options: ['Andes', 'Alpes', 'Himalaya', 'Rocosas'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which imaginary line divides Earth into the Northern and Southern Hemispheres?',
      options: ['Equator', 'Prime Meridian', 'Tropic of Cancer', 'Arctic Circle'],
    },
    es: {
      prompt: 'Que linea imaginaria divide la Tierra en hemisferio norte y sur?',
      options: ['Ecuador', 'Meridiano de Greenwich', 'Tropico de Cancer', 'Circulo Polar'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which sea separates Europe from North Africa?',
      options: ['Mediterranean Sea', 'Baltic Sea', 'Caspian Sea', 'Red Sea'],
    },
    es: {
      prompt: 'Que mar separa Europa del norte de Africa?',
      options: ['Mar Mediterraneo', 'Mar Baltico', 'Mar Caspio', 'Mar Rojo'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the highest mountain in the world above sea level?',
      options: ['Everest', 'K2', 'Aconcagua', 'Kilimanjaro'],
    },
    es: {
      prompt: 'Cual es la montana mas alta del mundo sobre el nivel del mar?',
      options: ['Everest', 'K2', 'Aconcagua', 'Kilimanjaro'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What gas do plants absorb during photosynthesis?',
      options: ['Carbon dioxide', 'Oxygen', 'Helium', 'Nitrogen'],
    },
    es: {
      prompt: 'Que gas absorben las plantas durante la fotosintesis?',
      options: ['Dioxido de carbono', 'Oxigeno', 'Helio', 'Nitrogeno'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the chemical formula for water?',
      options: ['H2O', 'CO2', 'O2', 'NaCl'],
    },
    es: {
      prompt: 'Cual es la formula del agua?',
      options: ['H2O', 'CO2', 'O2', 'NaCl'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which organ pumps blood through the human body?',
      options: ['Heart', 'Liver', 'Lung', 'Pancreas'],
    },
    es: {
      prompt: 'Que organo bombea la sangre por todo el cuerpo?',
      options: ['Corazon', 'Higado', 'Pulmon', 'Pancreas'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the chemical symbol for sodium?',
      options: ['Na', 'So', 'Sn', 'Sd'],
    },
    es: {
      prompt: 'Cual es el simbolo quimico del sodio?',
      options: ['Na', 'So', 'Sn', 'Sd'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which molecule stores genetic information?',
      options: ['DNA', 'ATP', 'RNA', 'Chlorophyll'],
    },
    es: {
      prompt: 'Que molecula almacena la informacion genetica?',
      options: ['ADN', 'ATP', 'ARN', 'Clorofila'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In which organelle does photosynthesis occur?',
      options: ['Chloroplast', 'Nucleus', 'Mitochondrion', 'Vacuole'],
    },
    es: {
      prompt: 'En que organelo ocurre la fotosintesis?',
      options: ['Cloroplasto', 'Nucleo', 'Mitocondria', 'Vacuola'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the basic unit of living beings?',
      options: ['Cell', 'Atom', 'Tissue', 'Organ'],
    },
    es: {
      prompt: 'Cual es la unidad basica de los seres vivos?',
      options: ['Celula', 'Atomo', 'Tejido', 'Organo'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which organelle produces most of a cell\'s energy?',
      options: ['Mitochondrion', 'Ribosome', 'Lysosome', 'Golgi apparatus'],
    },
    es: {
      prompt: 'Que organelo produce gran parte de la energia celular?',
      options: ['Mitocondria', 'Ribosoma', 'Lisosoma', 'Aparato de Golgi'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which blood component mainly carries oxygen?',
      options: ['Red blood cells', 'Platelets', 'Plasma', 'White blood cells'],
    },
    es: {
      prompt: 'Que componente de la sangre transporta principalmente oxigeno?',
      options: ['Globulos rojos', 'Plaquetas', 'Plasma', 'Globulos blancos'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the fastest land animal?',
      options: ['Cheetah', 'Lion', 'Horse', 'Wolf'],
    },
    es: {
      prompt: 'Cual es el animal terrestre mas rapido?',
      options: ['Guepardo', 'Leon', 'Caballo', 'Lobo'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the largest mammal in the world?',
      options: ['Blue whale', 'Elephant', 'Giraffe', 'Hippopotamus'],
    },
    es: {
      prompt: 'Cual es el mamifero mas grande del mundo?',
      options: ['Ballena azul', 'Elefante', 'Jirafa', 'Hipopotamo'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'How many legs does a spider have?',
      options: ['8', '6', '10', '12'],
    },
    es: {
      prompt: 'Cuantas patas tiene una arana?',
      options: ['8', '6', '10', '12'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'How many sides does a triangle have?',
      options: ['3', '4', '5', '6'],
    },
    es: {
      prompt: 'Cuantos lados tiene un triangulo?',
      options: ['3', '4', '5', '6'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'How many units are in a dozen?',
      options: ['12', '10', '6', '20'],
    },
    es: {
      prompt: 'Cuanto es una docena?',
      options: ['12', '10', '6', '20'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the exact square root of 144?',
      options: ['12', '14', '16', '18'],
    },
    es: {
      prompt: 'Cual es la raiz cuadrada exacta de 144?',
      options: ['12', '14', '16', '18'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What decimal value does the binary number 1010 represent?',
      options: ['10', '8', '12', '14'],
    },
    es: {
      prompt: 'Que valor decimal tiene el numero binario 1010?',
      options: ['10', '8', '12', '14'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which of these numbers is prime?',
      options: ['29', '21', '27', '33'],
    },
    es: {
      prompt: 'Cual de estos numeros es primo?',
      options: ['29', '21', '27', '33'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which constant represents the ratio between a circle\'s circumference and diameter?',
      options: ['Pi', 'Euler', 'Phi', 'Sigma'],
    },
    es: {
      prompt: 'Que constante representa la relacion entre circunferencia y diametro?',
      options: ['Pi', 'Euler', 'Phi', 'Sigma'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'How much do the interior angles of a triangle add up to?',
      options: ['180 degrees', '90 degrees', '270 degrees', '360 degrees'],
    },
    es: {
      prompt: 'Cuanto suman los angulos interiores de un triangulo?',
      options: ['180 grados', '90 grados', '270 grados', '360 grados'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In what year did humans first land on the Moon?',
      options: ['1969', '1959', '1975', '1981'],
    },
    es: {
      prompt: 'En que ano llego el ser humano a la Luna?',
      options: ['1969', '1959', '1975', '1981'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which river was essential to ancient Egyptian civilization?',
      options: ['Nile', 'Amazon', 'Danube', 'Mississippi'],
    },
    es: {
      prompt: 'Que rio fue clave para el antiguo Egipto?',
      options: ['Nilo', 'Amazonas', 'Danubio', 'Misisipi'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What was the great city of the Mexica empire?',
      options: ['Tenochtitlan', 'Cusco', 'Machu Picchu', 'Chichen Itza'],
    },
    es: {
      prompt: 'Cual era la gran ciudad del imperio mexica?',
      options: ['Tenochtitlan', 'Cusco', 'Machu Picchu', 'Chichen Itza'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What language was mainly spoken by the ancient Romans?',
      options: ['Latin', 'Greek', 'Arabic', 'French'],
    },
    es: {
      prompt: 'Que idioma hablaban principalmente los romanos?',
      options: ['Latin', 'Griego', 'Arabe', 'Frances'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In what year did the Berlin Wall fall?',
      options: ['1989', '1979', '1995', '1961'],
    },
    es: {
      prompt: 'En que ano cayo el Muro de Berlin?',
      options: ['1989', '1979', '1995', '1961'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In which country did the European Renaissance begin?',
      options: ['Italy', 'France', 'Germany', 'Portugal'],
    },
    es: {
      prompt: 'En que pais comenzo el Renacimiento europeo?',
      options: ['Italia', 'Francia', 'Alemania', 'Portugal'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Who wrote Don Quixote?',
      options: ['Miguel de Cervantes', 'Gabriel Garcia Marquez', 'Pablo Neruda', 'Lope de Vega'],
    },
    es: {
      prompt: 'Quien escribio Don Quijote de la Mancha?',
      options: ['Miguel de Cervantes', 'Gabriel Garcia Marquez', 'Pablo Neruda', 'Lope de Vega'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Who wrote Romeo and Juliet?',
      options: ['William Shakespeare', 'Charles Dickens', 'Moliere', 'Jules Verne'],
    },
    es: {
      prompt: 'Quien escribio Romeo y Julieta?',
      options: ['William Shakespeare', 'Charles Dickens', 'Moliere', 'Jules Verne'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Who painted the Mona Lisa?',
      options: ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Claude Monet'],
    },
    es: {
      prompt: 'Quien pinto la Mona Lisa?',
      options: ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Claude Monet'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Who painted Guernica?',
      options: ['Pablo Picasso', 'Salvador Dali', 'Diego Velazquez', 'Joan Miro'],
    },
    es: {
      prompt: 'Quien pinto Guernica?',
      options: ['Pablo Picasso', 'Salvador Dali', 'Diego Velazquez', 'Joan Miro'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Who is traditionally credited as the author of The Odyssey?',
      options: ['Homer', 'Plato', 'Aristotle', 'Socrates'],
    },
    es: {
      prompt: 'Quien es el autor atribuido de La Odisea?',
      options: ['Homero', 'Platon', 'Aristoteles', 'Socrates'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which sport uses a hoop to score points?',
      options: ['Basketball', 'Baseball', 'Tennis', 'Golf'],
    },
    es: {
      prompt: 'En que deporte se usa una canasta?',
      options: ['Baloncesto', 'Beisbol', 'Tenis', 'Golf'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In which sport do players mainly use their feet to pass the ball?',
      options: ['Football', 'Handball', 'Water polo', 'Volleyball'],
    },
    es: {
      prompt: 'En que deporte se usa principalmente el pie para pasar la pelota?',
      options: ['Futbol', 'Balonmano', 'Waterpolo', 'Voleibol'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which markup language is used to structure web content?',
      options: ['HTML', 'CSS', 'SQL', 'Photoshop'],
    },
    es: {
      prompt: 'Que lenguaje se usa para estructurar contenido web?',
      options: ['HTML', 'CSS', 'SQL', 'Photoshop'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which technology is mainly used for visual styling on a web page?',
      options: ['CSS', 'Python', 'Git', 'Docker'],
    },
    es: {
      prompt: 'Que tecnologia se usa principalmente para estilos visuales en una pagina web?',
      options: ['CSS', 'Python', 'Git', 'Docker'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which tool is commonly used for version control?',
      options: ['Git', 'Figma', 'Blender', 'Excel'],
    },
    es: {
      prompt: 'Que herramienta se usa para control de versiones?',
      options: ['Git', 'Figma', 'Blender', 'Excel'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What do we call an ordered set of steps to solve a problem?',
      options: ['Algorithm', 'Pixel', 'Cache', 'Kernel'],
    },
    es: {
      prompt: 'Como se llama un conjunto ordenado de pasos para resolver un problema?',
      options: ['Algoritmo', 'Pixel', 'Cache', 'Kernel'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'In which galaxy is the solar system located?',
      options: ['Milky Way', 'Andromeda', 'Sombrero', 'Magellanic Clouds'],
    },
    es: {
      prompt: 'En que galaxia se encuentra el sistema solar?',
      options: ['Via Lactea', 'Andromeda', 'Sombrero', 'Nubes de Magallanes'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What is the Sun?',
      options: ['A star', 'A planet', 'A satellite', 'An asteroid'],
    },
    es: {
      prompt: 'Que es el Sol?',
      options: ['Una estrella', 'Un planeta', 'Un satelite', 'Un asteroide'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which planet is farthest from the Sun?',
      options: ['Neptune', 'Saturn', 'Uranus', 'Jupiter'],
    },
    es: {
      prompt: 'Que planeta esta mas lejos del Sol?',
      options: ['Neptuno', 'Saturno', 'Urano', 'Jupiter'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What do we call a region in space whose gravity is so strong that even light cannot escape?',
      options: ['Black hole', 'Nebula', 'Comet', 'Supernova'],
    },
    es: {
      prompt: 'Como se llama una region del espacio con gravedad tan intensa que ni la luz escapa?',
      options: ['Agujero negro', 'Nebulosa', 'Cometa', 'Supernova'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'How many continents are recognized in the seven-continent model?',
      options: ['7', '6', '5', '8'],
    },
    es: {
      prompt: 'Cuantos continentes se reconocen en el modelo de siete continentes?',
      options: ['7', '6', '5', '8'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which country belongs to Oceania?',
      options: ['New Zealand', 'Chile', 'Peru', 'Morocco'],
    },
    es: {
      prompt: 'Cual de estos paises pertenece a Oceania?',
      options: ['Nueva Zelanda', 'Chile', 'Peru', 'Marruecos'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'What color do you get when you mix blue and yellow?',
      options: ['Green', 'Red', 'Purple', 'Orange'],
    },
    es: {
      prompt: 'Que color aparece al mezclar azul y amarillo?',
      options: ['Verde', 'Rojo', 'Morado', 'Naranja'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which famous trade route connected Asia and Europe?',
      options: ['Silk Road', 'Inca Trail', 'Appian Way', 'Gold Route'],
    },
    es: {
      prompt: 'Como se llamaba la gran ruta comercial entre Asia y Europa?',
      options: ['Ruta de la Seda', 'Camino Inca', 'Via Apia', 'Ruta del Oro'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which scientist is associated with the movable-type printing press in Europe?',
      options: ['Johannes Gutenberg', 'Isaac Newton', 'Leonardo da Vinci', 'Galileo Galilei'],
    },
    es: {
      prompt: 'Quien es asociado con la imprenta de tipos moviles en Europa?',
      options: ['Johannes Gutenberg', 'Isaac Newton', 'Leonardo da Vinci', 'Galileo Galilei'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which relative positions explain the phases of the Moon seen from Earth?',
      options: ['Sun-Earth-Moon positions', 'Mars shadow', 'Solar wind', 'Jupiter rotation'],
    },
    es: {
      prompt: 'Que posiciones relativas explican las fases de la Luna vistas desde la Tierra?',
      options: ['Posiciones Sol-Tierra-Luna', 'Sombra de Marte', 'Viento solar', 'Rotacion de Jupiter'],
    },
  },
  {
    correctOption: 0,
    en: {
      prompt: 'Which country declared independence in 1776?',
      options: ['United States', 'Mexico', 'France', 'Brazil'],
    },
    es: {
      prompt: 'Que pais declaro su independencia en 1776?',
      options: ['Estados Unidos', 'Mexico', 'Francia', 'Brasil'],
    },
  },
]

const QUESTION_SEEDS: LocalQuestionSeed[] = QUESTION_BANK.map((entry, questionIndex) => ({
  category: 0,
  correctOption: entry.correctOption,
  difficulty: 0,
  options: entry.en.options,
  prompt: entry.en.prompt,
  questionIndex,
}))

const QUESTION_COPY_ES: Record<number, QuestionCopy> = Object.fromEntries(
  QUESTION_BANK.map((entry, questionIndex) => [questionIndex, entry.es]),
)

const normalizeHex = (value: string) => `0x${BigInt(value).toString(16)}`

const hashPair = (left: string, right: string) =>
  normalizeHex(hash.computePoseidonHashOnElements([left, right]))

const buildQuestionLeafHash = (seed: LocalQuestionSeed) =>
  normalizeHex(
    hash.computePoseidonHashOnElements([
      seed.questionIndex.toString(),
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

export const LOCAL_QUESTION_SET_ID = 1n
export const LOCAL_QUESTION_SET_COUNT = QUESTION_SEEDS.length
export const LOCAL_QUESTION_SET_ROOT = artifacts.root
export const LOCAL_QUESTION_SET_VERSION = 1

export const LOCAL_QUESTION_SET = artifacts.hydratedQuestions

export const getHydratedQuestion = (
  questionIndex: number,
  category: number,
  _difficulty: number,
  language: AppLanguage = 'en',
): HydratedQuestion | null => {
  const baseQuestion =
    LOCAL_QUESTION_SET.find(
      (question) => question.questionIndex === questionIndex && question.category === category,
    ) ?? null

  if (!baseQuestion) {
    return null
  }

  const localizedCopy = QUESTION_COPY_ES[questionIndex]

  return {
    ...baseQuestion,
    displayOptions: language === 'es' && localizedCopy ? localizedCopy.options : baseQuestion.options,
    displayPrompt: language === 'es' && localizedCopy ? localizedCopy.prompt : baseQuestion.prompt,
  }
}

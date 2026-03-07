import type { AppLanguage } from '../store/app-settings-store'

export type TriviaDifficulty = 'easy' | 'medium' | 'hard'

export type TriviaQuestionTheme = 'blue' | 'green' | 'orange' | 'pink'

export type TriviaQuestion = {
  category: string
  correctIndex: number
  difficulty: TriviaDifficulty
  icon: string
  id: string
  options: [string, string, string, string]
  prompt: string
  theme: TriviaQuestionTheme
}

type TriviaSeed = {
  category: string
  difficulty: TriviaDifficulty
  icon: string
  id: string
  options: [string, string, string, string]
  prompt: string
  theme: TriviaQuestionTheme
}

type TriviaPoolByLanguage = Record<AppLanguage, Record<TriviaDifficulty, TriviaSeed[]>>

export const triviaSecondsByDifficulty: Record<TriviaDifficulty, number> = {
  easy: 20,
  medium: 16,
  hard: 12,
}

const aiCorrectChanceByDifficulty: Record<TriviaDifficulty, number> = {
  easy: 0.38,
  medium: 0.62,
  hard: 0.84,
}

const shuffleArray = <T,>(values: readonly T[]) => {
  const next = [...values]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = temp
  }

  return next
}

const toQuestion = (seed: TriviaSeed): TriviaQuestion => {
  const options = shuffleArray(seed.options)

  return {
    ...seed,
    correctIndex: options.indexOf(seed.options[0]),
    options: options as [string, string, string, string],
  }
}

const easySeeds: TriviaSeed[] = [
  { id: 'easy-capital-argentina', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Argentina?', options: ['Buenos Aires', 'Cordoba', 'Lima', 'Bogota'] },
  { id: 'easy-capital-france', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Francia?', options: ['Paris', 'Roma', 'Lisboa', 'Berlin'] },
  { id: 'easy-capital-japan', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Japon?', options: ['Tokio', 'Seul', 'Pekin', 'Bangkok'] },
  { id: 'easy-capital-brazil', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Brasil?', options: ['Brasilia', 'Rio de Janeiro', 'Sao Paulo', 'Montevideo'] },
  { id: 'easy-capital-mexico', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Mexico?', options: ['Ciudad de Mexico', 'Cancun', 'Guadalajara', 'Quito'] },
  { id: 'easy-capital-italy', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Italia?', options: ['Roma', 'Milan', 'Napoles', 'Atenas'] },
  { id: 'easy-capital-portugal', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Portugal?', options: ['Lisboa', 'Madrid', 'Porto', 'Barcelona'] },
  { id: 'easy-capital-colombia', difficulty: 'easy', category: 'Geografia', icon: '🗺️', theme: 'blue', prompt: 'Cual es la capital de Colombia?', options: ['Bogota', 'Medellin', 'Quito', 'Caracas'] },
  { id: 'easy-planet-largest', difficulty: 'easy', category: 'Espacio', icon: '🪐', theme: 'pink', prompt: 'Cual es el planeta mas grande del sistema solar?', options: ['Jupiter', 'Marte', 'Saturno', 'Urano'] },
  { id: 'easy-planet-red', difficulty: 'easy', category: 'Espacio', icon: '🪐', theme: 'pink', prompt: 'Que planeta es conocido como el planeta rojo?', options: ['Marte', 'Venus', 'Neptuno', 'Mercurio'] },
  { id: 'easy-planet-rings', difficulty: 'easy', category: 'Espacio', icon: '🪐', theme: 'pink', prompt: 'Que planeta es famoso por sus anillos?', options: ['Saturno', 'Jupiter', 'Mercurio', 'Tierra'] },
  { id: 'easy-planet-nearest-sun', difficulty: 'easy', category: 'Espacio', icon: '🪐', theme: 'pink', prompt: 'Cual es el planeta mas cercano al Sol?', options: ['Mercurio', 'Venus', 'Marte', 'Jupiter'] },
  { id: 'easy-science-water', difficulty: 'easy', category: 'Ciencia', icon: '🔬', theme: 'green', prompt: 'Cual es la formula del agua?', options: ['H2O', 'CO2', 'O2', 'NaCl'] },
  { id: 'easy-science-plant-gas', difficulty: 'easy', category: 'Ciencia', icon: '🔬', theme: 'green', prompt: 'Que gas toman las plantas para la fotosintesis?', options: ['Dioxido de carbono', 'Oxigeno', 'Helio', 'Nitrogeno'] },
  { id: 'easy-science-human-bones', difficulty: 'easy', category: 'Ciencia', icon: '🔬', theme: 'green', prompt: 'Cuantas patas tiene una arana?', options: ['8', '6', '10', '12'] },
  { id: 'easy-science-rainbow', difficulty: 'easy', category: 'Ciencia', icon: '🔬', theme: 'green', prompt: 'Que color aparece al mezclar azul y amarillo?', options: ['Verde', 'Rojo', 'Morado', 'Naranja'] },
  { id: 'easy-animal-fastest', difficulty: 'easy', category: 'Naturaleza', icon: '🐾', theme: 'orange', prompt: 'Cual es el animal terrestre mas rapido?', options: ['Guepardo', 'Leon', 'Caballo', 'Lobo'] },
  { id: 'easy-animal-mammal', difficulty: 'easy', category: 'Naturaleza', icon: '🐾', theme: 'orange', prompt: 'Cual de estos animales es un mamifero?', options: ['Delfin', 'Tiburon', 'Pulpo', 'Trucha'] },
  { id: 'easy-animal-king-jungle', difficulty: 'easy', category: 'Naturaleza', icon: '🐾', theme: 'orange', prompt: 'Que animal es conocido como el rey de la selva?', options: ['Leon', 'Tigre', 'Elefante', 'Gorila'] },
  { id: 'easy-animal-largest-mammal', difficulty: 'easy', category: 'Naturaleza', icon: '🐾', theme: 'orange', prompt: 'Cual es el mamifero mas grande del mundo?', options: ['Ballena azul', 'Elefante', 'Jirafa', 'Hipopotamo'] },
  { id: 'easy-sport-basket', difficulty: 'easy', category: 'Deportes', icon: '🏀', theme: 'orange', prompt: 'En que deporte se usa una canasta?', options: ['Baloncesto', 'Beisbol', 'Tenis', 'Golf'] },
  { id: 'easy-sport-feet', difficulty: 'easy', category: 'Deportes', icon: '🏀', theme: 'orange', prompt: 'En que deporte se usa principalmente el pie para pasar la pelota?', options: ['Futbol', 'Balonmano', 'Waterpolo', 'Voleibol'] },
  { id: 'easy-math-triangle', difficulty: 'easy', category: 'Logica', icon: '🧠', theme: 'green', prompt: 'Cuantos lados tiene un triangulo?', options: ['3', '4', '5', '6'] },
  { id: 'easy-math-dozen', difficulty: 'easy', category: 'Logica', icon: '🧠', theme: 'green', prompt: 'Cuanto es una docena?', options: ['12', '10', '6', '20'] },
]

const mediumSeeds: TriviaSeed[] = [
  { id: 'medium-history-moon', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'En que ano llego el ser humano a la Luna?', options: ['1969', '1959', '1975', '1981'] },
  { id: 'medium-history-printing', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'Quien es asociado con la imprenta de tipos moviles en Europa?', options: ['Johannes Gutenberg', 'Isaac Newton', 'Leonardo da Vinci', 'Galileo Galilei'] },
  { id: 'medium-history-rome', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'Como se llamaba la gran ruta comercial entre Asia y Europa?', options: ['Ruta de la Seda', 'Camino Inca', 'Via Apia', 'Ruta del Oro'] },
  { id: 'medium-history-french-revolution', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'En que pais comenzo la Revolucion Francesa?', options: ['Francia', 'Italia', 'Austria', 'Belgica'] },
  { id: 'medium-history-independence-usa', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'Que fecha se asocia con la independencia de Estados Unidos?', options: ['1776', '1492', '1810', '1914'] },
  { id: 'medium-history-egypt-river', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'Que rio fue clave para el antiguo Egipto?', options: ['Nilo', 'Amazonas', 'Danubio', 'Misisipi'] },
  { id: 'medium-history-aztec-city', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'Cual era la gran ciudad del imperio mexica?', options: ['Tenochtitlan', 'Cusco', 'Machu Picchu', 'Chichen Itza'] },
  { id: 'medium-history-rome-language', difficulty: 'medium', category: 'Historia', icon: '📜', theme: 'orange', prompt: 'Que idioma hablaban principalmente los romanos?', options: ['Latin', 'Griego', 'Arabe', 'Frances'] },
  { id: 'medium-geography-amazon', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'Cual es el rio mas caudaloso del mundo?', options: ['Amazonas', 'Nilo', 'Ebro', 'Yangtse'] },
  { id: 'medium-geography-everest', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'Cual es la montana mas alta del mundo?', options: ['Everest', 'Aconcagua', 'K2', 'Kilimanjaro'] },
  { id: 'medium-geography-sahara', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'En que continente esta el desierto del Sahara?', options: ['Africa', 'Asia', 'Oceania', 'America'] },
  { id: 'medium-geography-canada', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'Que pais tiene mas superficie territorial?', options: ['Canada', 'China', 'Estados Unidos', 'India'] },
  { id: 'medium-geography-oceania', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'Cual de estos paises pertenece a Oceania?', options: ['Nueva Zelanda', 'Chile', 'Peru', 'Marruecos'] },
  { id: 'medium-geography-mediterranean', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'Que mar separa Europa del norte de Africa?', options: ['Mediterraneo', 'Baltico', 'Caspio', 'Rojo'] },
  { id: 'medium-geography-andes', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'En que cordillera esta el Aconcagua?', options: ['Andes', 'Alpes', 'Himalaya', 'Rocosas'] },
  { id: 'medium-geography-equator', difficulty: 'medium', category: 'Geografia', icon: '🌎', theme: 'blue', prompt: 'Que linea imaginaria divide la Tierra en hemisferio norte y sur?', options: ['Ecuador', 'Meridiano de Greenwich', 'Tropico de Cancer', 'Circulo Polar'] },
  { id: 'medium-science-sodium', difficulty: 'medium', category: 'Ciencia', icon: '⚗️', theme: 'green', prompt: 'Cual es el simbolo quimico del sodio?', options: ['Na', 'So', 'Sn', 'Sd'] },
  { id: 'medium-science-red-blood', difficulty: 'medium', category: 'Ciencia', icon: '⚗️', theme: 'green', prompt: 'Que organo bombea la sangre por todo el cuerpo?', options: ['Corazon', 'Higado', 'Pulmon', 'Pancreas'] },
  { id: 'medium-science-dna', difficulty: 'medium', category: 'Ciencia', icon: '⚗️', theme: 'green', prompt: 'Que molecula almacena la informacion genetica?', options: ['ADN', 'ATP', 'RNA', 'Clorofila'] },
  { id: 'medium-science-light-speed', difficulty: 'medium', category: 'Ciencia', icon: '⚗️', theme: 'green', prompt: 'Que viaja mas rapido en el vacio?', options: ['La luz', 'El sonido', 'El viento solar', 'La electricidad de un cable'] },
  { id: 'medium-literature-quixote', difficulty: 'medium', category: 'Cultura', icon: '📚', theme: 'pink', prompt: 'Quien escribio Don Quijote de la Mancha?', options: ['Miguel de Cervantes', 'Gabriel Garcia Marquez', 'Pablo Neruda', 'Lope de Vega'] },
  { id: 'medium-literature-monalisa', difficulty: 'medium', category: 'Cultura', icon: '📚', theme: 'pink', prompt: 'Quien pinto la Mona Lisa?', options: ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Claude Monet'] },
  { id: 'medium-literature-romeo', difficulty: 'medium', category: 'Cultura', icon: '📚', theme: 'pink', prompt: 'Quien escribio Romeo y Julieta?', options: ['William Shakespeare', 'Charles Dickens', 'Moliere', 'Jules Verne'] },
  { id: 'medium-literature-hundred-years', difficulty: 'medium', category: 'Cultura', icon: '📚', theme: 'pink', prompt: 'Quien escribio Cien anos de soledad?', options: ['Gabriel Garcia Marquez', 'Mario Vargas Llosa', 'Julio Cortazar', 'Jorge Luis Borges'] },
]

const hardSeeds: TriviaSeed[] = [
  { id: 'hard-math-prime', difficulty: 'hard', category: 'Matematicas', icon: '🧮', theme: 'green', prompt: 'Cual de estos numeros es primo?', options: ['29', '21', '27', '33'] },
  { id: 'hard-math-pi', difficulty: 'hard', category: 'Matematicas', icon: '🧮', theme: 'green', prompt: 'Que constante representa la relacion entre circunferencia y diametro?', options: ['Pi', 'Euler', 'Phi', 'Sigma'] },
  { id: 'hard-math-angle', difficulty: 'hard', category: 'Matematicas', icon: '🧮', theme: 'green', prompt: 'Cuanto suman los angulos interiores de un triangulo?', options: ['180 grados', '90 grados', '270 grados', '360 grados'] },
  { id: 'hard-math-binary', difficulty: 'hard', category: 'Matematicas', icon: '🧮', theme: 'green', prompt: 'Que valor decimal tiene el numero binario 1010?', options: ['10', '8', '12', '14'] },
  { id: 'hard-math-square-root', difficulty: 'hard', category: 'Matematicas', icon: '🧮', theme: 'green', prompt: 'Cual es la raiz cuadrada exacta de 144?', options: ['12', '14', '16', '18'] },
  { id: 'hard-computing-html', difficulty: 'hard', category: 'Tecnologia', icon: '💻', theme: 'blue', prompt: 'Que lenguaje se usa para estructurar contenido web?', options: ['HTML', 'CSS', 'SQL', 'Photoshop'] },
  { id: 'hard-computing-css', difficulty: 'hard', category: 'Tecnologia', icon: '💻', theme: 'blue', prompt: 'Que tecnologia se usa principalmente para estilos visuales en una pagina web?', options: ['CSS', 'Python', 'Git', 'Docker'] },
  { id: 'hard-computing-git', difficulty: 'hard', category: 'Tecnologia', icon: '💻', theme: 'blue', prompt: 'Que herramienta se usa para control de versiones?', options: ['Git', 'Figma', 'Blender', 'Excel'] },
  { id: 'hard-computing-algorithm', difficulty: 'hard', category: 'Tecnologia', icon: '💻', theme: 'blue', prompt: 'Como se llama un conjunto ordenado de pasos para resolver un problema?', options: ['Algoritmo', 'Pixel', 'Cache', 'Kernel'] },
  { id: 'hard-computing-array', difficulty: 'hard', category: 'Tecnologia', icon: '💻', theme: 'blue', prompt: 'En programacion, que describe mejor a un array?', options: ['Coleccion ordenada de valores', 'Servidor de correo', 'Lenguaje de estilos', 'Tipo de base de datos'] },
  { id: 'hard-astronomy-galaxy', difficulty: 'hard', category: 'Espacio', icon: '🌌', theme: 'pink', prompt: 'En que galaxia se encuentra el sistema solar?', options: ['Via Lactea', 'Andromeda', 'Sombrero', 'Magallanes'] },
  { id: 'hard-astronomy-star', difficulty: 'hard', category: 'Espacio', icon: '🌌', theme: 'pink', prompt: 'Que es el Sol?', options: ['Una estrella', 'Un planeta', 'Un satelite', 'Un asteroide'] },
  { id: 'hard-astronomy-neptune', difficulty: 'hard', category: 'Espacio', icon: '🌌', theme: 'pink', prompt: 'Que planeta esta mas lejos del Sol?', options: ['Neptuno', 'Saturno', 'Urano', 'Jupiter'] },
  { id: 'hard-astronomy-phases', difficulty: 'hard', category: 'Espacio', icon: '🌌', theme: 'pink', prompt: 'Que cuerpo celeste provoca las fases lunares visibles desde la Tierra?', options: ['La posicion relativa Sol-Tierra-Luna', 'La sombra de Marte', 'El viento solar', 'La rotacion de Jupiter'] },
  { id: 'hard-astronomy-blackhole', difficulty: 'hard', category: 'Espacio', icon: '🌌', theme: 'pink', prompt: 'Como se llama una region del espacio con gravedad tan intensa que ni la luz escapa?', options: ['Agujero negro', 'Nebulosa', 'Cometa', 'Supernova'] },
  { id: 'hard-biology-cell', difficulty: 'hard', category: 'Biologia', icon: '🧬', theme: 'green', prompt: 'Cual es la unidad basica de los seres vivos?', options: ['Celula', 'Atomo', 'Tejido', 'Organo'] },
  { id: 'hard-biology-mitochondria', difficulty: 'hard', category: 'Biologia', icon: '🧬', theme: 'green', prompt: 'Que organelo produce gran parte de la energia celular?', options: ['Mitocondria', 'Ribosoma', 'Cloroplasto', 'Lisosoma'] },
  { id: 'hard-biology-blood', difficulty: 'hard', category: 'Biologia', icon: '🧬', theme: 'green', prompt: 'Que componente de la sangre ayuda a transportar oxigeno?', options: ['Globulos rojos', 'Plaquetas', 'Plasma', 'Linfocitos'] },
  { id: 'hard-biology-photosynthesis', difficulty: 'hard', category: 'Biologia', icon: '🧬', theme: 'green', prompt: 'En que organelo ocurre la fotosintesis?', options: ['Cloroplasto', 'Nucleo', 'Mitocondria', 'Vacuola'] },
  { id: 'hard-culture-odyssey', difficulty: 'hard', category: 'Cultura', icon: '🏛️', theme: 'orange', prompt: 'Quien es el autor atribuido de La Odisea?', options: ['Homero', 'Platon', 'Aristoteles', 'Socrates'] },
  { id: 'hard-culture-guernica', difficulty: 'hard', category: 'Cultura', icon: '🏛️', theme: 'orange', prompt: 'Quien pinto Guernica?', options: ['Pablo Picasso', 'Salvador Dali', 'Diego Velazquez', 'Joan Miro'] },
  { id: 'hard-culture-baroque', difficulty: 'hard', category: 'Cultura', icon: '🏛️', theme: 'orange', prompt: 'En que periodo artistico se ubica Diego Velazquez?', options: ['Barroco', 'Renacimiento', 'Impresionismo', 'Cubismo'] },
  { id: 'hard-history-wall', difficulty: 'hard', category: 'Historia', icon: '🏛️', theme: 'orange', prompt: 'En que ano cayo el Muro de Berlin?', options: ['1989', '1979', '1995', '1961'] },
  { id: 'hard-history-renaissance', difficulty: 'hard', category: 'Historia', icon: '🏛️', theme: 'orange', prompt: 'En que pais comenzo el Renacimiento europeo?', options: ['Italia', 'Francia', 'Alemania', 'Portugal'] },
]

const easySeedsEn: TriviaSeed[] = [
  { id: 'en-easy-capital-argentina', difficulty: 'easy', category: 'Geography', icon: '🗺️', theme: 'blue', prompt: 'What is the capital of Argentina?', options: ['Buenos Aires', 'Cordoba', 'Lima', 'Bogota'] },
  { id: 'en-easy-capital-france', difficulty: 'easy', category: 'Geography', icon: '🗺️', theme: 'blue', prompt: 'What is the capital of France?', options: ['Paris', 'Rome', 'Lisbon', 'Berlin'] },
  { id: 'en-easy-planet-largest', difficulty: 'easy', category: 'Space', icon: '🪐', theme: 'pink', prompt: 'Which is the largest planet in the solar system?', options: ['Jupiter', 'Mars', 'Saturn', 'Uranus'] },
  { id: 'en-easy-planet-red', difficulty: 'easy', category: 'Space', icon: '🪐', theme: 'pink', prompt: 'Which planet is known as the red planet?', options: ['Mars', 'Venus', 'Neptune', 'Mercury'] },
  { id: 'en-easy-science-water', difficulty: 'easy', category: 'Science', icon: '🔬', theme: 'green', prompt: 'What is the chemical formula for water?', options: ['H2O', 'CO2', 'O2', 'NaCl'] },
  { id: 'en-easy-science-rainbow', difficulty: 'easy', category: 'Science', icon: '🔬', theme: 'green', prompt: 'What color do you get by mixing blue and yellow?', options: ['Green', 'Red', 'Purple', 'Orange'] },
  { id: 'en-easy-animal-fastest', difficulty: 'easy', category: 'Nature', icon: '🐾', theme: 'orange', prompt: 'What is the fastest land animal?', options: ['Cheetah', 'Lion', 'Horse', 'Wolf'] },
  { id: 'en-easy-sport-basket', difficulty: 'easy', category: 'Sports', icon: '🏀', theme: 'orange', prompt: 'In which sport do players score using a hoop?', options: ['Basketball', 'Baseball', 'Tennis', 'Golf'] },
  { id: 'en-easy-math-triangle', difficulty: 'easy', category: 'Logic', icon: '🧠', theme: 'green', prompt: 'How many sides does a triangle have?', options: ['3', '4', '5', '6'] },
  { id: 'en-easy-math-dozen', difficulty: 'easy', category: 'Logic', icon: '🧠', theme: 'green', prompt: 'How many units are in a dozen?', options: ['12', '10', '6', '20'] },
]

const mediumSeedsEn: TriviaSeed[] = [
  { id: 'en-medium-history-moon', difficulty: 'medium', category: 'History', icon: '📜', theme: 'orange', prompt: 'In what year did humans first land on the Moon?', options: ['1969', '1959', '1975', '1981'] },
  { id: 'en-medium-history-printing', difficulty: 'medium', category: 'History', icon: '📜', theme: 'orange', prompt: 'Who is associated with the movable-type printing press in Europe?', options: ['Johannes Gutenberg', 'Isaac Newton', 'Leonardo da Vinci', 'Galileo Galilei'] },
  { id: 'en-medium-history-french-revolution', difficulty: 'medium', category: 'History', icon: '📜', theme: 'orange', prompt: 'In which country did the French Revolution begin?', options: ['France', 'Italy', 'Austria', 'Belgium'] },
  { id: 'en-medium-geography-amazon', difficulty: 'medium', category: 'Geography', icon: '🌎', theme: 'blue', prompt: 'Which is the largest river by volume in the world?', options: ['Amazon', 'Nile', 'Ebro', 'Yangtze'] },
  { id: 'en-medium-geography-everest', difficulty: 'medium', category: 'Geography', icon: '🌎', theme: 'blue', prompt: 'What is the highest mountain in the world?', options: ['Everest', 'Aconcagua', 'K2', 'Kilimanjaro'] },
  { id: 'en-medium-science-sodium', difficulty: 'medium', category: 'Science', icon: '⚗️', theme: 'green', prompt: 'What is the chemical symbol for sodium?', options: ['Na', 'So', 'Sn', 'Sd'] },
  { id: 'en-medium-science-dna', difficulty: 'medium', category: 'Science', icon: '⚗️', theme: 'green', prompt: 'Which molecule stores genetic information?', options: ['DNA', 'ATP', 'RNA', 'Chlorophyll'] },
  { id: 'en-medium-literature-quixote', difficulty: 'medium', category: 'Culture', icon: '📚', theme: 'pink', prompt: 'Who wrote Don Quixote?', options: ['Miguel de Cervantes', 'Gabriel Garcia Marquez', 'Pablo Neruda', 'Lope de Vega'] },
  { id: 'en-medium-literature-monalisa', difficulty: 'medium', category: 'Culture', icon: '📚', theme: 'pink', prompt: 'Who painted the Mona Lisa?', options: ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Claude Monet'] },
  { id: 'en-medium-literature-romeo', difficulty: 'medium', category: 'Culture', icon: '📚', theme: 'pink', prompt: 'Who wrote Romeo and Juliet?', options: ['William Shakespeare', 'Charles Dickens', 'Moliere', 'Jules Verne'] },
]

const hardSeedsEn: TriviaSeed[] = [
  { id: 'en-hard-math-prime', difficulty: 'hard', category: 'Mathematics', icon: '🧮', theme: 'green', prompt: 'Which of these numbers is prime?', options: ['29', '21', '27', '33'] },
  { id: 'en-hard-math-pi', difficulty: 'hard', category: 'Mathematics', icon: '🧮', theme: 'green', prompt: 'Which constant represents the ratio between a circle\'s circumference and diameter?', options: ['Pi', 'Euler', 'Phi', 'Sigma'] },
  { id: 'en-hard-math-angle', difficulty: 'hard', category: 'Mathematics', icon: '🧮', theme: 'green', prompt: 'How much do the interior angles of a triangle add up to?', options: ['180 degrees', '90 degrees', '270 degrees', '360 degrees'] },
  { id: 'en-hard-computing-html', difficulty: 'hard', category: 'Technology', icon: '💻', theme: 'blue', prompt: 'Which language is used to structure web content?', options: ['HTML', 'CSS', 'SQL', 'Photoshop'] },
  { id: 'en-hard-computing-css', difficulty: 'hard', category: 'Technology', icon: '💻', theme: 'blue', prompt: 'Which technology is mainly used for visual styling on a web page?', options: ['CSS', 'Python', 'Git', 'Docker'] },
  { id: 'en-hard-astronomy-galaxy', difficulty: 'hard', category: 'Space', icon: '🌌', theme: 'pink', prompt: 'In which galaxy is the solar system located?', options: ['Milky Way', 'Andromeda', 'Sombrero', 'Magellanic Clouds'] },
  { id: 'en-hard-astronomy-blackhole', difficulty: 'hard', category: 'Space', icon: '🌌', theme: 'pink', prompt: 'What do we call a region in space whose gravity is so intense that even light cannot escape?', options: ['Black hole', 'Nebula', 'Comet', 'Supernova'] },
  { id: 'en-hard-biology-cell', difficulty: 'hard', category: 'Biology', icon: '🧬', theme: 'green', prompt: 'What is the basic unit of living beings?', options: ['Cell', 'Atom', 'Tissue', 'Organ'] },
  { id: 'en-hard-culture-odyssey', difficulty: 'hard', category: 'Culture', icon: '🏛️', theme: 'orange', prompt: 'Who is traditionally credited as the author of The Odyssey?', options: ['Homer', 'Plato', 'Aristotle', 'Socrates'] },
  { id: 'en-hard-history-wall', difficulty: 'hard', category: 'History', icon: '🏛️', theme: 'orange', prompt: 'In what year did the Berlin Wall fall?', options: ['1989', '1979', '1995', '1961'] },
]

const questionPoolsByLanguage: TriviaPoolByLanguage = {
  es: {
    easy: easySeeds,
    medium: mediumSeeds,
    hard: hardSeeds,
  },
  en: {
    easy: easySeedsEn,
    medium: mediumSeedsEn,
    hard: hardSeedsEn,
  },
}

export const drawTriviaQuestion = (
  difficulty: TriviaDifficulty,
  usedQuestionIds: ReadonlySet<string>,
  language: AppLanguage = 'es',
) => {
  const pool = questionPoolsByLanguage[language][difficulty]
  const available = pool.filter((question) => !usedQuestionIds.has(question.id))
  const source = available.length > 0 ? available : pool
  const seed = source[Math.floor(Math.random() * source.length)]

  return toQuestion(seed)
}

export const pickAiTriviaAnswer = (question: TriviaQuestion, difficulty: TriviaDifficulty) => {
  const answerCorrectly = Math.random() < aiCorrectChanceByDifficulty[difficulty]

  if (answerCorrectly) {
    return question.correctIndex
  }

  const wrongOptions = [0, 1, 2, 3].filter((index) => index !== question.correctIndex)
  return wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || 0
}

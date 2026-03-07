import {
  LOCAL_QUESTION_SET_COUNT,
  LOCAL_QUESTION_SET_ID,
  LOCAL_QUESTION_SET_ROOT,
  LOCAL_QUESTION_SET_VERSION,
} from '../src/lib/questions/local-question-bank'

console.log(`set_id=${LOCAL_QUESTION_SET_ID.toString()}`)
console.log(`question_count=${LOCAL_QUESTION_SET_COUNT}`)
console.log(`version=${LOCAL_QUESTION_SET_VERSION}`)
console.log(`merkle_root=${LOCAL_QUESTION_SET_ROOT}`)

// run.mjs
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { getActiveByUser, getAllActive, getActiveCount, getHistoryByUser } from './queries.mjs'

const rl = createInterface({ input, output })

async function main() {
  console.clear()
  console.log('=== SUPABASE CLI ===')
  console.log('1) Ativas por usuário')
  console.log('2) Todas as ativas')
  console.log('3) Contagem de ativas')
  console.log('4) Histórico por usuário')
  console.log('0) Sair')
  const opt = await rl.question('\nEscolha uma opção: ')

  try {
    if (opt === '1') {
      const userId = await rl.question('Digite o user_id: ')
      const data = await getActiveByUser(userId.trim())
      console.log('\nAtivas do usuário:\n', JSON.stringify(data, null, 2))
    } else if (opt === '2') {
      const data = await getAllActive()
      console.log('\nATIVAS (todas):\n', JSON.stringify(data, null, 2))
    } else if (opt === '3') {
      const count = await getActiveCount()
      console.log('\nQuantidade de ativas:', count)
    } else if (opt === '4') {
      const userId = await rl.question('Digite o user_id: ')
      const data = await getHistoryByUser(userId.trim())
      console.log('\nHistórico do usuário:\n', JSON.stringify(data, null, 2))
    } else {
      console.log('Saindo...')
    }
  } catch (err) {
    console.error('\nERRO:', err?.message ?? err)
  } finally {
    rl.close()
  }
}

main()

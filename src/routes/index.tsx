import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
// import {CreateP2PKHContract} from '../components/createcontract/'
import {CreateP2PKHContract} from '../components/createtip/'

export default component$(() => {
  return (
    <div>
    <CreateP2PKHContract/>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'xec web-tipper',
};



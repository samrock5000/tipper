import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import {CreateContract} from '../components/createcontract/'

export default component$(() => {
  return (
    <div>
    <CreateContract/>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'xec web-tipper',
};



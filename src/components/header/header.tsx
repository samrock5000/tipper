import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { EcashIcon } from '../icons/ecash';

import styles from './header.css?inline';



export default component$(() => {
  useStylesScoped$(styles);

  return (
    <header>
      <div class="logo">
        <a href="https://e.cash" target="_blank">
          <EcashIcon
           />
        </a>
      </div>
      <ul>
        <li>
          <a href="https://qwik.builder.io/docs/components/overview/" target="_blank">
            Docs
          </a>
        </li>
      </ul>
    </header>
  );
});

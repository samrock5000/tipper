import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { EcashIcon } from '../icons/ecash';
import styles from './header.css?inline';

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <header>
      <div class="logo">
        <a href="https://e.cash/" target="_blank">
          <EcashIcon />
        </a>
      </div>
      <ul>
        <li>
          <a href="/">
            Home
          </a>
        </li>
        {/* <li>
          <a href="https://qwik.builder.io/examples/introduction/hello-world/" target="_blank">
            Examples
          </a>
        </li>
        <li>
          <a href="https://qwik.builder.io/tutorial/welcome/overview/" target="_blank">
            Tutorials
          </a>
        </li> */}
      </ul>
    </header>
  );
});

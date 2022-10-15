import { component$, Slot } from '@builder.io/qwik';
import Header from '../components/header/header';

export default component$(() => {
  return (
    <>
      <main>
        <Header />
        <section>
          <Slot />
        </section>
      </main>
      <footer>
        <a href="https://www.github.com/samrock5000/" target="_blank">
          Made with ♡ by samuel nevarez
        </a>
      </footer>
    </>
  );
});

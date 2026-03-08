import Banner from '../components/banner/Banner';
import Nav from '../components/nav/Nav';
import Product from './Product/Product';

export default function Home() {
  return (
    <>
      <Nav />

      <main>
        <Banner />
        <Product />
      </main>
    </>
  );
}

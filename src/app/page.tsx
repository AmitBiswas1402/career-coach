import Categories from "@/components/Categories";
import Hero from "@/components/Hero";
import Restaurants from "@/components/Restaurants";

const Home = () => {
  return (
    <div className="min-h-screen bg-surface-cream">
      <Hero />
      <Categories />
      <Restaurants />
    </div>
  );
};

export default Home;

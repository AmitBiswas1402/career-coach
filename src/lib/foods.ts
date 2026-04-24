import { StaticImageData } from "next/image";
import northIndian from "@/lib/images/foods/north-indian.jpg";
import biryani from "@/lib/images/foods/biryani.jpg";
import chinese from "@/lib/images/foods/chinese.jpg";
import dessert from "@/lib/images/foods/dessert.jpg";
import cake from "@/lib/images/foods/cake.jpg";
import pizza from "@/lib/images/foods/pizza.jpg";
import rolls from "@/lib/images/foods/rolls.jpg";
import southIndian from "@/lib/images/foods/south-indian.jpg";
import idli from "@/lib/images/foods/idli.jpg";
import burger from "@/lib/images/foods/burger.jpg";
import jalebi from "@/lib/images/foods/jalebi.jpg";
import dosa from "@/lib/images/foods/dosa.jpg";
import tea from "@/lib/images/foods/tea.jpg";
import parantha from "@/lib/images/foods/parantha.jpg";
import poori from "@/lib/images/foods/poori.jpg";
import salad from "@/lib/images/foods/salad.jpg";
import pastry from "@/lib/images/foods/pastry.jpg";
import rasgulla from "@/lib/images/foods/rasgulla.jpg";
import vada from "@/lib/images/foods/vada.jpg";
import choleBhature from "@/lib/images/foods/chole-bhature.jpg";

export interface FoodCategory {
  id: number;
  name: string;
  image: StaticImageData;
}

export const foodCategories: FoodCategory[] = [
  { id: 1, name: "North Indian", image: northIndian },
  { id: 2, name: "Biryani", image: biryani },
  { id: 3, name: "Chinese", image: chinese },
  { id: 4, name: "Desserts", image: dessert },
  { id: 5, name: "Cake", image: cake },
  { id: 6, name: "Pizza", image: pizza },
  { id: 7, name: "Rolls", image: rolls },
  { id: 8, name: "South Indian", image: southIndian },
  { id: 9, name: "Idli", image: idli },
  { id: 10, name: "Burger", image: burger },
  { id: 11, name: "Jalebi", image: jalebi },
  { id: 12, name: "Dosa", image: dosa },
  { id: 13, name: "Tea", image: tea },
  { id: 14, name: "Paratha", image: parantha },
  { id: 15, name: "Poori", image: poori },
  { id: 16, name: "Salad", image: salad },
  { id: 17, name: "Pastry", image: pastry },
  { id: 18, name: "Rasgulla", image: rasgulla },
  { id: 19, name: "Vada", image: vada },
  { id: 20, name: "Chole Bhature", image: choleBhature },
];
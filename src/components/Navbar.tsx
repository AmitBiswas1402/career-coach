import Link from "next/link"
import Users from "./Users"

const Navbar = () => {
  return (
    <div className="flex items-center gap-6 bg-black px-10 py-6">
        {/* Brand */}
      <Link href={"/"}>
        <h1 className="text-2xl font-extrabold text-white shrink-0">Food</h1>
      </Link>

      {/* Spacer */}
      <div className="ml-auto" />

      {/* User actions */}
      <Users />
    </div>
  )
}
export default Navbar
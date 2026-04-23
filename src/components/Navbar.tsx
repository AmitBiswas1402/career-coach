import Link from "next/link"

const Navbar = () => {
  return (
    <div className="flex items-center gap-6 bg-black px-10 py-6">
        {/* Brand */}
      <Link href={"/"}>
        <h1 className="text-2xl font-extrabold text-white shrink-0">Food</h1>
      </Link>

      {/* Spacer */}
      <div className="ml-auto" />

      {/* User icon placeholder (re-add Clerk later with fresh keys) */}
      <div className="shrink-0 text-white cursor-pointer hover:text-gray-300 transition-colors">
        {/* <Users /> */}
      </div>
    </div>
  )
}
export default Navbar
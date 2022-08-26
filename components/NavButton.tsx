interface INavButtonProp {
    title: string
    onClick: () => void
  }
  
  export const NavButton = (prop:INavButtonProp)=>{
    return (
      <h2>
        <button className="w-full hover:bg-[#10b5ff] px-4 py-2 rounded-lg text-left" onClick={prop.onClick}> {prop.title}</button>
      </h2>
      
    )
  }
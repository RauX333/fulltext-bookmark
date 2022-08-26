interface ISettingBlockProp {
    title: string
    children: React.ReactNode
}

export const SettingBlock = (prop: ISettingBlockProp) => {
    return (
        <div className="flex flex-col gap-4 my-4 max-w-xl">
            <h2 className="text-lg font-bold">{prop.title}</h2>
            {prop.children}
        </div>
    )
}
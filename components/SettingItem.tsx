interface ISettingItemProp {
    description: string
    notes?: string
    children: React.ReactNode
}
export const SettingItem = (prop: ISettingItemProp) => {
    return (
        <>
         <div className="flex flex-row gap-4 mt-2">
            {prop.children}
            <span className="text-md">{prop.description}</span>
        </div>
        <div>
            {prop.notes && <span className="text-md text-gray-500 whitespace-pre-wrap">{prop.notes}</span>}
        </div>
        </>
       
    )
}
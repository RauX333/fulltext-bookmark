interface ISettingItemColProp {
    description: string
    notes?: string
    children: React.ReactNode
}

export const SettingItemCol = (prop: ISettingItemColProp) => {
    return (
        <div className="mt-2 flex flex-col">
        
            <span className="text-md">{prop.description}</span>
       
       
            {prop.notes && <span className="text-md text-gray-500 whitespace-pre-wrap">{prop.notes}</span>}
            <div className="mt-2">
            {prop.children}
            </div>
        
        
        </div>
        
    )
}
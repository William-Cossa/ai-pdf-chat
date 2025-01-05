import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from './sheet'
import { Menu } from 'lucide-react'
import ChatComponent from './ChatComponent'
import ChatSideBar from './ChatSideBar'
import { DrizzleChat } from '@/lib/db/schema'
import { Button } from './ui/button'

type Props = {
    chats: DrizzleChat[];
    chatId: number;
    isPro: boolean;
  };
function MenuMobile({ isPro , chatId, chats}: Props) {
  return (
    <div className='absolute lg:hidden top-0 left-0 z-50 '>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant={"ghost"}>
                    <Menu className=''/>
                </Button>
            </SheetTrigger>
            <SheetContent side={'left'} className='p-0 pt-8 text-gray-200 bg-gray-900'>
                
                <ChatSideBar chats={chats} chatId={chatId} isPro={isPro}/>
            </SheetContent>
        </Sheet>
    </div>
  )
}

export default MenuMobile
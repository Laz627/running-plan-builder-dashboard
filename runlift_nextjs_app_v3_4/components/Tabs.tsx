'use client';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>){
  return <TabsPrimitive.Root {...props} />;
}
export function TabsList(props: React.ComponentProps<typeof TabsPrimitive.List>){
  return <TabsPrimitive.List className={cn('inline-flex gap-2 p-1 border border-gray-200 dark:border-gray-800 rounded-xl', props.className)} {...props}/>;
}
export function TabsTrigger({className, ...props}: React.ComponentProps<typeof TabsPrimitive.Trigger>){
  return <TabsPrimitive.Trigger className={cn('px-3 py-1.5 rounded-lg text-sm data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800', className)} {...props}/>;
}
export function TabsContent(props: React.ComponentProps<typeof TabsPrimitive.Content>){
  return <TabsPrimitive.Content className={cn('mt-3', props.className)} {...props}/>;
}

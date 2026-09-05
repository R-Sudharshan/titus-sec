import React, { useEffect, useState } from 'react';
import {
  MantineProvider,
  AppShell,
  AppShellHeader,
  AppShellNavbar,
  AppShellAside,
  AppShellMain,
  AppShellFooter,
  Button,
  Card,
  Group,
  ScrollArea,
  Text,
  Modal,
  Loader,
  TextInput,
  Stack
} from '@mantine/core';
import { IconApi, IconHistory, IconSettings, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import XTermPanel from './XTermPanel';

const API_ROOT = 'http://localhost:8000';

function useEventStream(setTimeline: any, setPendingTask: any) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/events');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setTimeline((prev: any) => [...prev, msg]);
      if (msg.type === 'task_requested') setPendingTask(msg.task);
    };
    ws.onerror = console.warn;
    return () => ws.close();
  }, [setTimeline, setPendingTask]);
}

export default function App() {
  const [tools, setTools] = useState<any[]>([]);
  const [pendingTask, setPendingTask] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskParams, setTaskParams] = useState<Record<string, any>>({
    nmap: { target: '127.0.0.1', options: '-F' }
  });
  const [modalOpened, setModalOpened] = useState(false);

  useEventStream(setTimeline, setPendingTask);

  useEffect(() => {
    fetch(`${API_ROOT}/api/tools`).then(r=>r.json()).then(setTools);
  }, []);

  useEffect(()=>{ setModalOpened(!!pendingTask); },[pendingTask]);

  function requestTool(tool: any) {
    setLoading(true);
    const params = taskParams[tool.name] || {};
    fetch(`${API_ROOT}/api/task/request`, {
      method:'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ plugin: tool.category, tool_name: tool.name, parameters: params })
    })
      .then(r=>r.json())
      .finally(()=>setLoading(false));
  }

  function handleApproval(allow: boolean) {
    setLoading(true);
    fetch(`${API_ROOT}/api/task/approve`, {
      method:'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ id: pendingTask.id, allow })
    })
    .then(()=>{
      setLoading(false);
      setPendingTask(null);
      setModalOpened(false);
    });
  }

  return (
    <MantineProvider>
      <AppShell
        padding="md"
        navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: true } }}
        aside={{ width: 360, breakpoint: 'md', collapsed: { mobile: true } }}
        header={{ height: 60 }}
        footer={{ height: 40 }}
      >
        <AppShellHeader p="xs">
          <Group align="center" h="100%">
            <IconApi size={32}/>
            <Text fw={900} style={{letterSpacing:1}}>MCP Security AI IDE</Text>
            <Button variant='light' ml='auto' leftSection={<IconSettings size={16}/>}>Settings</Button>
          </Group>
        </AppShellHeader>
        <AppShellNavbar p="xs">
          <Text fw={700} size="lg">MCP Security</Text>
          <Text size='sm' c="dimmed" mt='md' mb={4}>Tools</Text>
          <ScrollArea h={400}>
            {tools.map((t, i) => {
              const currentParams = taskParams[t.name] || {};
              return (
                <Card withBorder key={t.name} p="sm" my={4} shadow="xs">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={600} size="sm">{t.name}</Text>
                      <Button size="xs" leftSection={<IconApi size={14}/>} loading={loading} onClick={()=>requestTool(t)}>
                        Request
                      </Button>
                    </Group>
                    <Text size="xs" c="dimmed">{t.description}</Text>
                    {t.name === 'nmap' && (
                      <Stack gap="xs" mt="xs">
                        <TextInput
                          label="Target"
                          size="xs"
                          placeholder="e.g. 127.0.0.1"
                          value={currentParams.target || ''}
                          onChange={(e) => setTaskParams(prev => ({
                            ...prev,
                            [t.name]: { ...currentParams, target: e.target.value }
                          }))}
                        />
                        <TextInput
                          label="Options"
                          size="xs"
                          placeholder="e.g. -F"
                          value={currentParams.options || ''}
                          onChange={(e) => setTaskParams(prev => ({
                            ...prev,
                            [t.name]: { ...currentParams, options: e.target.value }
                          }))}
                        />
                      </Stack>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </ScrollArea>
          <Group mt='md'>
            <Button variant="light" leftSection={<IconHistory size={18}/>} fullWidth>Sessions</Button>
          </Group>
        </AppShellNavbar>
        <AppShellAside p="xs">
          <Text fw={700} mb={8}>Timeline</Text>
          <ScrollArea h={480}>
            {timeline.length<1 && <Text size="xs" c="dimmed">No events yet.</Text>}
            {timeline.slice().reverse().map((e, i) => (
              <Card key={i} withBorder p={8} mb={6} shadow={e.type.includes('error')? 'md' : 'sm'} radius={8}>
                <Text size="sm" fw={600}>{e.type.replace(/_/g,' ').toUpperCase()}</Text>
                <Text size="xs" c="dimmed">{e.task?.tool_name} ({e.task?.status})</Text>
                {e.task?.command && <Text size="xs" ff="mono">{e.task.command}</Text>}
                {e.task?.message && <Text size="xs">{e.task.message}</Text>}
                {e.task?.risk && <Text size="xs" c="orange.6">Risk: {e.task.risk}</Text>}
              </Card>
            ))}
          </ScrollArea>
        </AppShellAside>
        <AppShellMain>
        <Modal opened={modalOpened} onClose={()=>setModalOpened(false)} title='Approve Action' centered>
          {pendingTask && (
            <div>
              <Text mb='sm' size='md' fw={700}>{pendingTask.tool_name}</Text>
              <Text size='sm'>{pendingTask.message}</Text>
              <Text size='sm' ff='mono' mt='xs' mb='xs'>
                {pendingTask.command}
              </Text>
              {pendingTask.risk && <Text size='sm' c='orange.7'>Risk: {pendingTask.risk}</Text>}
              <Group mt='lg' gap='md'>
                <Button leftSection={<IconPlayerPlay size={16}/>} disabled={loading} onClick={()=>handleApproval(true)}>Approve/Run</Button>
                <Button leftSection={<IconPlayerStop size={16}/>} disabled={loading} color='red' variant='outline' onClick={()=>handleApproval(false)}>Deny</Button>
                {loading && <Loader size={20}/>}              
              </Group>
            </div>
          )}
        </Modal>
        <XTermPanel timeline={timeline}/>
        </AppShellMain>
        <AppShellFooter p="xs" h={40}>
          <Text size="xs">© 2026 MCP Security Assistant | Local only</Text>
        </AppShellFooter>
      </AppShell>
    </MantineProvider>
  );
}

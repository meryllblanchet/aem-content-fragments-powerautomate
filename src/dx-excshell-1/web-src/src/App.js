// react imports
import React, {useState, useEffect} from 'react'
import {ErrorBoundary} from 'react-error-boundary'

// todo switch to react spectrum components once available
import '@spectrum-css/card/dist/index-vars.css';
import '@spectrum-css/asset/dist/index-vars.css';
import '@spectrum-css/quickaction/dist/index-vars.css';

// todo use layout components
// import { Grid, Flex } from '@react-spectrum/layout'
import { Dialog, DialogTrigger, ActionButton, Button, ButtonGroup, Content,
        Divider, TextField, Link, Form, ProgressCircle, Heading, Text, TextArea, Well, Breadcrumbs,
        Item, Provider, defaultTheme } from '@adobe/react-spectrum';
import InfoIcon from '@spectrum-icons/workflow/Info';
import OpenInIcon from '@spectrum-icons/workflow/OpenIn';
import DeleteIcon from '@spectrum-icons/workflow/Delete';
import EditIcon from '@spectrum-icons/workflow/Edit';
import FileIcon from '@spectrum-icons/workflow/DocumentOutline';
import FolderIcon from '@spectrum-icons/workflow/FolderOutline';

// local imports
import './App.css'
import actions from './config.json'
import aem from './aem.json'

let headers = {};
const {instance, api} = aem;

let abortControllers = [];

async function translate(text, callback) {
  const resp = await fetch(actions['translate'], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({
      'text': text
    })
  });

  if (resp.ok) {
    callback(await resp.text());
  }
}

function ErrorFallback({error, componentStack}) {
  return (
    <>
      <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Something went wrong :(</h1>
      <pre>{ componentStack + '\n' + error.message }</pre>
    </>
  )
}

function onDialogSubmit(action, data, callback) {
  const [isPending, setIsPending] = useState(false);
  
  return [isPending, async (closeDialog) => {
    setIsPending(true);
  
    const resp = await fetch(actions[action], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        instance,
        api,
        ...data
      })
    });
  
    if (resp.ok) {
      callback();
      closeDialog();
    }
    else {
      console.error(resp.statusText);
    }
  
    setIsPending(false);
  }];
}

function AssetIcon({item, src}) {
  return (
    src ? <img className="spectrum-Asset-image" src={`data:image/png;base64,${src}`} style={{opacity: 1}}/>
      : (item.class[0] === 'assets/folder' ?
      <FolderIcon size="XL" />
      :
      <FileIcon size="XL" />)
  );
}

function Delete({path, item, refresh}) {
  const [isPending, action] = onDialogSubmit('delete', {
    path: path === '' ? item.properties.name : `${path}/${item.properties.name}`,
  }, refresh);
  
  return (
    <DialogTrigger>
      <ActionButton isQuiet marginStart="size-100">
        <DeleteIcon size="S" />
      </ActionButton>
      {(close) => (
        <Dialog maxWidth="size-6000">
          <Heading>Confirm deletion</Heading>
          <Divider/>
          <Content>
            <Text>Are you sure you want to delete {item.properties.title || item.properties.name} ?</Text>
          </Content>
          <ButtonGroup>
            <ProgressCircle marginX="size-200" isHidden={!isPending} size="XS" isIndeterminate
                            aria-label="Deleting an item"/>
            <Button variant="secondary" onPress={close}>Cancel</Button>
            <Button isDisabled={isPending} variant="negative" onPress={() => {action(close)}}>Delete</Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  )
}

function CreateContentFragment({path, refresh}) {
  const [model] = useState('/conf/e-on/settings/dam/cfm/models/e-on-content-fragments-model');
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [isPending, action] = onDialogSubmit('create', {
    path: path === '' ? name : `${path}/${name}`,
    data: {
      properties: {
        'cq:model': model,
        title,
        elements: {
          title: {
            value: '',
            ':type': 'string'
          },
          text: {
            value: '',
            ':type': 'text/html'
          }
        }
      }
    }
  }, refresh);
  
  const onChange = (value) => {
    setTitle(value);
    setName(value.replace(/[^A-Z0-9]/ig, '-'));
  };
  
  return (
    <DialogTrigger>
      <Button variant="cta">Create a content fragment</Button>
      {(close) => (
        <Dialog maxWidth="size-6000">
          <Heading>Create a content fragment</Heading>
          <Divider/>
          <Content>
            <Form marginTop="size-10" marginBottom="size-10">
              <TextField label="Model" value={model} isReadOnly/>
              <TextField label="Title" placeholder="Enter a title" autoFocus value={title} onChange={onChange}/>
              <TextField label="Name" placeholder="Enter a name" value={name} isReadOnly/>
            </Form>
          </Content>
          <ButtonGroup>
            <ProgressCircle marginX="size-200" isHidden={!isPending} size="XS" isIndeterminate
                            aria-label="Creating a content fragment"/>
            <Button variant="secondary" onPress={close}>Cancel</Button>
            <Button isDisabled={isPending} variant="cta" onPress={() => {action(close)}}>Create</Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  );
}

function CreateFolder({path, refresh}) {
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [isPending, action] = onDialogSubmit('create', {
    path: path === '' ? name : `${path}/${name}`,
    data: {
      'class': 'assetFolder',
      properties: {
        title
      }
    }
  }, refresh);
  
  const onChange = (value) => {
    setTitle(value);
    setName(value.replace(/[^A-Z0-9]/ig, '-'));
  };
  
  return (
    <DialogTrigger>
      <Button variant="primary">Create a folder</Button>
      {(close) => (
        <Dialog maxWidth="size-6000">
          <Heading>Create a folder</Heading>
          <Divider/>
          <Content>
            <Form marginTop="size-10" marginBottom="size-10">
              <TextField label="Title" placeholder="Enter a title" autoFocus value={title} onChange={onChange}/>
              <TextField label="Name" placeholder="Enter a name" isReadOnly value={name}/>
            </Form>
          </Content>
          <ButtonGroup>
            <ProgressCircle marginX="size-200" isHidden={!isPending} size="XS" isIndeterminate
                            aria-label="Creating a folder"/>
            <Button variant="secondary" onPress={close}>Cancel</Button>
            <Button isDisabled={isPending} variant="cta" onPress={() => {action(close)}}>Create</Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  )
}

function CardAsset({item, path}) {
  const [src, setSrc] = useState('');
  
  useEffect(() => {
    const abortController = new AbortController();
    abortControllers.push(abortController);
    
    const name = item.properties.name;
    
    fetch(actions['thumbnail'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        instance: instance,
        api,
        path: path === '' ? name : `${path}/${name}`,
      }),
      importance: 'low',
      signal: abortController.signal
    })
      .then((res) => {
        if (res.ok) {
          res.json().then(({base64}) => {
            setSrc(base64);
          });
        }
      });
  }, []);
  
  return (
    <AssetIcon item={item} src={src}/>
  )
}

function Editor({item, path, refresh}) {
  const originalTitle = item.properties.elements?.title?.value ?? '';
  const originalText = item.properties.elements?.text?.value ?? '';
  const [title, setTitle] = useState(originalTitle);
  const [text, setText] = useState(originalText);
  
  const name = item.properties.name;
  const [isPending, action] = onDialogSubmit('update', {
    path: path === '' ? name : `${path}/${name}`,
    data: {
      properties: {
        elements: {
          title: {
            value: title,
            ':type': 'string'
          },
          text: {
            value: text,
            ':type': 'text/html'
          }
        }
      }
    }
  }, refresh);
  
  return (
    <DialogTrigger type="fullscreenTakeover">
      <ActionButton isQuiet marginStart="size-100">
        <EditIcon size="S" />
      </ActionButton>
      {(close) => (
        <Dialog>
          <Heading>Custom Content Fragment Editor</Heading>
          <Divider/>
          <Content>
            <Heading level={2}>Title</Heading>
            <TextArea width='100%' minHeight='size-50' value={title} onChange={setTitle} />
            <br /><br />
            <Button isDisabled={false} variant="cta" onPress={() => { translate(title, setTitle);}}>Translate</Button>
            <Heading level={2}>Text</Heading>
            <TextArea width='100%' minHeight='size-3000' value={text} onChange={setText} />
            <br /><br />
            <Button isDisabled={false} variant="cta" onPress={() => { translate(text, setText);}}>Translate</Button>
          </Content>
          <ButtonGroup>
            <ProgressCircle marginX="size-200" isHidden={!isPending} size="XS" isIndeterminate
                            aria-label="Updating a content fragment"/>
            <Button variant="secondary" onPress={close}>Cancel</Button>
            <Button isDisabled={isPending} variant="cta" onPress={() => {action(close)}}>Save</Button>            
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  )
}

function OpenInAEM({path, item}) {
  return (
    <ActionButton isQuiet onPress={() => {
      window.open(`${instance}assets.html/content/dam/${path}/${item.properties.name}`, '_blank')
    }}>
      <OpenInIcon/>
    </ActionButton>
  )
}

function Navigation({refresh, path, onNavigate, onItemNavigate}) {
  // hash routing
  location.hash = path.value;
  
  const limit = 40;
  
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(-1);
  const [{isLoading, isDisabled}, setIsLoading] = useState({isLoading: false, isDisabled: false});
  
  useEffect(() => {
    // Cancel thumbnails loading
    abortControllers.forEach(abortController => abortController.abort());
    abortControllers = [];
    
    setIsLoading({isLoading: true, isDisabled: true});
    
    fetch(actions['read'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        instance,
        api,
        path: path.value,
        limit
      })
    })
      .then(res => res.json())
      .then(({entities = [], properties}) => {
        setIsLoading({isLoading: false, isDisabled: false});
        setItems(entities);
        setTotal(properties && properties['srn:paging'].total);
      });
  }, [path]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return;
      
      if (items.length < total) {
        setIsLoading({isLoading: true, isDisabled: false});
        
        fetch(actions['read'], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify({
            instance,
            api,
            path: path.value,
            offset: items.length,
            limit
          })
        })
          .then(req => req.json())
          .then(({entities = []}) => {
            setIsLoading({isLoading: false, isDisabled: false});
            setItems([...items, ...entities]);
          });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items, total]);
  
  const nav = [{
    name: 'Assets',
    path: ''
  }];
  
  if (path.value.length) {
    let partial = [];
    path.value.split('/').forEach((item) => {
      partial.push(item);
      nav.push({
        name: item,
        path: partial.join('/')
      })
    });
  }
  
  return (
    <div className={'console ' + (isDisabled ? 'is-disabled' : '')} style={{marginTop: 32, isolation: 'isolate'}}>
      <header>
        {path.value === '' &&
        <Breadcrumbs>
          <Item key="assets">Assets</Item>
        </Breadcrumbs>}
        
        {path.value !== '' &&
        <Breadcrumbs onAction={(path) => onNavigate(path)}>
          {nav.map(item => <Item key={item.path}>{item.name}</Item>)}
        </Breadcrumbs>}
        
        <ProgressCircle isHidden={!isLoading} size="M" isIndeterminate aria-label="Fetching AEM Assets tree"/>
        
        <div style={{marginLeft: 'auto'}}>
          <ButtonGroup>
            <CreateFolder path={path.value} refresh={refresh}/>
            <CreateContentFragment path={path.value} refresh={refresh}/>
          </ButtonGroup>
        </div>
      </header>
      
      <div role="grid">
        <div role="row" className="grid">
          {items.map(item =>
            <div onClick={(e) => {
              onItemNavigate(e, item)
            }} key={item.properties.name} className="grid-item" role="gridcell">
              <div className="spectrum-Card spectrum-Card--quiet" tabIndex="0" role="figure">
                <div className="spectrum-Card-preview">
                  <div className="spectrum-Asset">
                    <CardAsset item={item} path={path.value}/>
                  </div>
                </div>
                <div className="spectrum-Card-body">
                  <div className="spectrum-Card-header">
                    <div className="spectrum-Card-title">{item.properties.title ?? item.properties.name}</div>
                  </div>
                  <div className="spectrum-Card-content">
                    <div
                      className="spectrum-Card-subtitle">{item.class[0] === 'assets/folder' ? 'folder' : 'file'}</div>
                  </div>
                </div>
                <div className="spectrum-QuickActions spectrum-Card-actions">
                  <div style={{display: 'inline-block'}}>
                    <OpenInAEM path={path.value} item={item}/>
                    {item.properties.contentFragment && <Editor path={path.value} item={item} refresh={refresh}/>}
                    <Delete path={path.value} item={item} refresh={refresh}/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Info() {
  return (
    <div style={{display: 'flex', 'flexDirection': 'column'}}>
      <Heading>AEM as a Cloud Service Custom Content Fragment Editor</Heading>
      <Well>
        <div style={{fontSize: 16}}>
          <p>
            This Firefly app showcases a custom UI based on <Link><a target="_blank" href="https://react-spectrum.adobe.com">React Spectrum</a></Link> for AEM as a Cloud Service Assets by leveraging the Assets API.<br/>
            You can navigate through your AEM assets, do simple CRUD operations like creating a folder or a content fragment.<br/>
            The app also ships with a custom Markdown Editor with live preview and editing tools for Content Fragments to extend the original Markdown Editor capabilities.
          </p>
          <ul>
            <li>AEM as a Cloud Service author instance: <Link><a target="_blank" href={instance}>{instance}</a></Link></li>
            <li>AEM Assets API: <Link><a target="_blank" href="https://docs.adobe.com/content/help/en/experience-manager-65/assets/extending/mac-api-assets.html">{api}</a></Link>
            </li>
          </ul>
          <p><InfoIcon size="S" /> Please verify the AEM instance is not hibernated or de-hibernate it at least 15 minutes before running this demo.</p>
        </div>
      </Well>
    </div>
  )
}

function App({ims, runtime}) {
  // Current folder path and timestamp to refresh collection without changing path
  const [path, setPath] = useState({value: location.hash ? location.hash.slice(1) : '', timeStamp: new Date().getTime()});
  
  // Global headers for Runtime calls
  headers = {
    'x-gw-ims-org-id': ims.org,
    'authorization': `Bearer ${ims.token}`
  };
  
  // Passed down to Navigation actions to refresh current collection after a change
  const refresh = () => {
    // AEM latency buffer
    const latencyBuffer = 300;
    setTimeout(() => {
      setPath({value: path.value, timeStamp: new Date().getTime()});
    }, latencyBuffer);
  };
  
  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  // runtime.on('configuration', ({imsOrg, imsToken, locale}) => {
  //   console.log('configuration change', {imsOrg, imsToken, locale})
  // });
  // runtime.on('history', ({type, path}) => {
  //   console.log('history change', {type, path})
  // });
  
  
  const onItemNavigate = (e, item) => {
    if (!e.currentTarget.contains(e.target)) {
      return;
    }
    
    if (item.properties.contentFragment) {
      return;
    }
    
    const newPath = item.links[0].href.split('?')[0]
      .replace(instance, '')
      .replace(api, '')
      .replace('.json', '');
    
    setPath({value: newPath});
  };
  
  const onNavigate = (newPath) => {
    setPath({value: newPath});
  };
  
  return (
    <ErrorBoundary FallbackComponent={ ErrorFallback } >
      <Provider theme={defaultTheme} colorScheme="light" locale="en-US">
        <div style={{minHeight: '100vh', padding: '0 32px'}}>
          <Info/>
          <Navigation path={path} refresh={refresh} onNavigate={onNavigate} onItemNavigate={onItemNavigate}/>
        </div>
      </Provider>
    </ErrorBoundary>
  )
}

export default App;
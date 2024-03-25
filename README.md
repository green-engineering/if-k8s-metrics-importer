# if-k8s-metrics-importer

`if-k8s-metrics-importer ` is an importer plugin which pulls key metrics from Kubernetes (K8s). We look at metrics from the nodes, then drill down to pods and container level metrics.

![k8s importer image one](https://github.com/nb-green-ops/if-k8s-metrics-importer/assets/136962406/ead2fed8-2212-4182-8fde-d0b48b9ca929)

Once we receive the metrics, we make use of the environmental impact calculator which exposes an API for the Impact Framework [IF](https://github.com/Green-Software-Foundation/if) to retrieve energy and embodied carbon estimates.
 
## Implementation

**Index.ts**

We host the k8s-metrics-importer plugin in the index.ts file. This is where we run queries that fetch our key metrics from Kubernetes (if-k8s-metrics-importer/src/lib/k8s-metrics-importer/index.ts). We use the k8s metrics-server and standard k8s rest api's to pull the cpu and memory usage per container and get the node and pod details. 


## Usage

We reference the k8s-metrics-importer plugin in the 'basic.yml' file (if-k8s-metrics-importer/examples/k8s-metrics-importer/basic.yml at main · nb-green-ops/if-k8s-metrics-importer (github.com)).

```yaml 
plugins: 
    if-k8s-metrics-importer: 
      method: K8sMetricsImporter 
      path: "if-k8s-metrics-importer" 
      global-config: 
        token: [YOUR K8s TOKEN GOES HERE] 
        k8s-host-url: https://localhost:6443 
``` 

Please note, to recieve a Kubernetes token you will need to create your own kubernetes service account. A service account is a non-human account that provides a distinct identity in a Kubernetes cluster. Service accounts are managed by the Kubernetes API and are bound to specific namespaces. They are used to provide an identity for pods that want to interact with the API server. Service account credentials are stored as Kubernetes secrets, which are mounted into pods to allow in-cluster processes to talk to the Kubernetes API. 

EVERYTHING BELOW IS A WORK IN PROGRESS

To run the `<YOUR-CUSTOM-PLUGIN>`, an instance of `PluginInterface` must be created. Then, the plugin's `execute()` method can be called, passing required arguments to it.

This is how you could run the model in Typescript:

```typescript
async function runPlugin() {
  const newModel = await new MyCustomPlugin().configure(params);
  const usage = await newModel.calculate([
    {
      timestamp: '2021-01-01T00:00:00Z',
      duration: '15s',
      'cpu-util': 34,
    },
    {
      timestamp: '2021-01-01T00:00:15Z',
      duration: '15s',
      'cpu-util': 12,
    },
  ]);

  console.log(usage);
}

runPlugin();
```

## Testing model integration

### Using local links

For using locally developed model in `IF Framework` please follow these steps: 

1. On the root level of a locally developed model run `npm link`, which will create global package. It uses `package.json` file's `name` field as a package name. Additionally name can be checked by running `npm ls -g --depth=0 --link=true`.
2. Use the linked model in impl by specifying `name`, `method`, `path` in initialize models section. 

```yaml
name: plugin-demo-link
description: loads plugin
tags: null
initialize:
  plugins:
    my-custom-plugin:
      method: MyCustomPlugin
      path: "<name-field-from-package.json>"
      global-config:
        ...
...
```

### Using directly from Github

You can simply push your model to the public Github repository and pass the path to it in your impl.
For example, for a model saved in `github.com/my-repo/my-model` you can do the following:

npm install your model: 

```
npm install -g https://github.com/my-repo/my-model
```

Then, in your `impl`, provide the path in the model instantiation. You also need to specify which class the model instantiates. In this case you are using the `PluginInterface`, so you can specify `OutputModel`. 

```yaml
name: plugin-demo-git
description: loads plugin
tags: null
initialize:
  plugins:
    my-custom-plugin:
      method: MyCustomPlugin
      path: https://github.com/my-repo/my-model
      global-config:
        ...
...
```

Now, when you run the `manifest` using the IF CLI, it will load the model automatically. Run using:

```sh
ie --manifest <path-to-your-impl> --output <path-to-save-output>
```

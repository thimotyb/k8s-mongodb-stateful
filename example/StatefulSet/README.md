# MongoDB on Kubernetes with Stateful Sets

With the release of [Stateful Sets](http://kubernetes.io/docs/concepts/abstractions/controllers/statefulsets/) and custom [Storage Classes](http://kubernetes.io/docs/user-guide/persistent-volumes/#storageclasses), Kubernetes can automate all of the underlying infra required to run a MongoDB Replica Sets

*Note:* Stateful Sets are beta. **This requires Kubernetes 1.5.1**

## Before You Start

- Have a Kubernetes Cluster created with at least version 1.5.1
- Have admin access to the cluster

## Creating the Storage Class

The storage class will create the [Volumes](http://kubernetes.io/docs/user-guide/persistent-volumes) backing the MongoDB Replica Sets.

You can create Storage Classes with different provisioners depending on your Kubernetes environment. There are provisioners for [Google Cloud](http://kubernetes.io/docs/user-guide/persistent-volumes/#gce), [AWS](http://kubernetes.io/docs/user-guide/persistent-volumes/#aws), [Azure](http://kubernetes.io/docs/user-guide/persistent-volumes/#azure-disk), [GlusterFS](http://kubernetes.io/docs/user-guide/persistent-volumes/#glusterfs), [OpenStack Cinder](http://kubernetes.io/docs/user-guide/persistent-volumes/#openstack-cinder), [vSphere](http://kubernetes.io/docs/user-guide/persistent-volumes/#vsphere), [Ceph RBD](http://kubernetes.io/docs/user-guide/persistent-volumes/#ceph-rbd), and [Quobyte](http://kubernetes.io/docs/user-guide/persistent-volumes/#quobyte). Pick the right one for your deployment.

For example, this [YAML](googlecloud_ssd.yaml) uses a Google Cloud SSD Persistent Disk, and has the name "fast"

Create the Storage Class with the `kubectl` tool.

```
kubectl apply -f googlecloud_ssd.yaml
```

Replace `googlecloud_ssd.yaml` with another configuration file if you are not using Google Cloud. For example, if you are running Kubernetes on Azure, you can use the Azure SSD [YAML](azure_ssd.yaml). It uses the same name, "fast", so your application does not need to understand the underlying platform.

```
kubectl apply -f azure_ssd.yaml
```


Verify that the Storage Class is created

```
$ kubectl get storageclass   
NAME      TYPE
fast       kubernetes.io/gce-pd
```

## Creating the Stateful Set

The [example YAML](mongo-statefulset.yaml) creates a [Headless Service](http://kubernetes.io/docs/user-guide/services/#headless-services) and a [Stateful Set](http://kubernetes.io/docs/concepts/abstractions/controllers/statefulsets/). It uses the Storage Class created in the previous step, and provisions a 100Gi volume per replica. Modify these values as you see fit.

```
kubectl apply -f mongo-statefulset.yaml
```

Verify that the Stateful Set is created
```
$ kubectl get statefulset
NAME      DESIRED   CURRENT   AGE
mongo     3         0         12m
```
The Stateful Set controller will spin up each replica one at a time. Eventually, all three will be created.

```
$ kubectl get statefulset
NAME      DESIRED   CURRENT   AGE
mongo     3         3         12m
```

You can also verify that the Volumes were created as well.

```
$ kubectl get pvc         
NAME                               STATUS    VOLUME                                     CAPACITY   ACCESSMODES   AGE
mongo-persistent-storage-mongo-0   Bound     pvc-af87f9d5-d3ab-11e6-8cf2-42010af0018d   100Gi      RWO           12m
mongo-persistent-storage-mongo-1   Bound     pvc-af8cef48-d3ab-11e6-8cf2-42010af0018d   100Gi      RWO           12m
mongo-persistent-storage-mongo-2   Bound     pvc-af8f1d24-d3ab-11e6-8cf2-42010af0018d   100Gi      RWO           12m
```

## Connecting to the MongoDB Replica Set

Each pod in a StatefulSet backed by a Headless Service will have a stable DNS name. The template follows this format: <pod-name>.<service-name>
Each MongoDB Replica Set will have its own DNS address. This will take the format `<pod-name>.<service-name>`.

For our example, the DNS addresses to use will be:

```
mongo-0.mongo
mongo-1.mongo
mongo-2.mongo
```

Put these in your connection url. For example:

```
mongodb://mongo-0.mongo,mongo-1.mongo,mongo-2.mongo:27017/dbname_?'
```

Connect to the first replica set member:

kubectl exec -ti mongo-0 -- mongosh

You now have a REPL environment connected to the MongoDB.

Let's instantiate the replica set with a default configuration by running the rs.initiate() command:

rs.initiate()

Print the replica set configuration; run the rs.conf() command:

rs.conf()

This outputs the details for the current member of replica set rs0. In this lab you see only one member.

Type "exit" and press enter to quit the REPL.

-----

### Scaling the MongoDB replica set

A big advantage of Kubernetes and StatefulSets is that you can scale the number of MongoDB Replicas up and down with a single command!

To scale up the number of replica set members from 3 to 5, run this command:

kubectl scale --replicas=5 statefulset mongo

In a few minutes, there will be 5 MongoDB pods.



